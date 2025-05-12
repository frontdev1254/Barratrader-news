require('dotenv').config();
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// ——————————————————————————————————————————————
// SETTINGS
// ——————————————————————————————————————————————
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY;
const TELEGRAM_TOKEN      = process.env.TELEGRAM_TOKEN;
const TG_GROUP_ID         = process.env.TG_GROUP_ID   || '-1002236857439';
const TG_TOPIC_ID         = parseInt(process.env.TG_TOPIC_ID, 10) || 62124;

// Creates the bot in polling mode
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Loads history of already sent IDs
const sentNewsFile = path.resolve(__dirname, 'sent_news.json');
let sentNews = [];
if (fs.existsSync(sentNewsFile)) {
  try {
    sentNews = JSON.parse(fs.readFileSync(sentNewsFile, 'utf-8'));
  } catch (err) {
    logger.error(`Erro ao ler histórico: ${err.message}`);
    sentNews = [];
  }
}

// Single log at the start
console.log(`[${new Date().toISOString()}] 🚀 Bot iniciado em polling. Histórico carregado: ${sentNews.length} IDs.`);

let firstRun = true;

// ——————————————————————————————————————————————
// MAIN FUNCTIONS
// ——————————————————————————————————————————————
async function getCryptoPanicNews() {
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&kind=news&regions=pt`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return Array.isArray(json.results) ? json.results : [];
  } catch (err) {
    logger.error(`Erro ao buscar notícias: ${err.message}`);
    return [];
  }
}

async function sendNewsToTelegram(news) {
  for (const article of news) {
    const id = article.id;
    if (sentNews.includes(id)) continue;

    const title = article.title;
    const link  = article.url;
    const msg   = `<b>${title}</b>\n\n<a href=\"${link}\">Leia mais</a>`;

    try {
      await bot.sendMessage(
        TG_GROUP_ID,
        msg,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          message_thread_id: TG_TOPIC_ID
        }
      );
      sentNews.push(id);
      fs.writeFileSync(sentNewsFile, JSON.stringify(sentNews, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`Erro ao enviar para Telegram: ${err.message}`);
    }
  }
}

// ——————————————————————————————————————————————
// LOOP PRINCIPAL
// ——————————————————————————————————————————————
async function main() {
  try {
    const allNews = await getCryptoPanicNews();

    if (firstRun) {
      if (allNews.length > 0) {
        // Marks all IDs except the most recent one
        sentNews = allNews.slice(1).map(a => a.id);
        fs.writeFileSync(sentNewsFile, JSON.stringify(sentNews, null, 2), 'utf-8');

        // Sends only the most recent one
        const latest = allNews[0];
        const title  = latest.title;
        const link   = latest.url;
        const msg    = `<b>${title}</b>\n\n<a href=\"${link}\">Leia mais</a>`;
        try {
          await bot.sendMessage(
            TG_GROUP_ID,
            msg,
            {
              parse_mode: 'HTML',
              disable_web_page_preview: false,
              message_thread_id: TG_TOPIC_ID
            }
          );
          sentNews.push(latest.id);
          fs.writeFileSync(sentNewsFile, JSON.stringify(sentNews, null, 2), 'utf-8');
        } catch (err) {
          logger.error(`Erro ao enviar última notícia: ${err.message}`);
        }
      }
      firstRun = false;
    } else {
      const fresh = allNews.filter(a => !sentNews.includes(a.id));
      if (fresh.length) {
        await sendNewsToTelegram(fresh);
      }
    }
  } catch (err) {
    logger.error(`Erro no loop principal: ${err.message}`);
  }

  setTimeout(main, 60 * 1000);
}

// Starts the loop
main();