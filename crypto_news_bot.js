require('dotenv').config();
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const translate = require('@vitalets/google-translate-api').default;
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// ——————————————————————————————————————————————
// CONFIGURAÇÃO
// ——————————————————————————————————————————————
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_GROUP_ID = process.env.TG_GROUP_ID || '-1002236857439';
const TG_TOPIC_ID = parseInt(process.env.TG_TOPIC_ID, 10) || 62124;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const sentNewsFile = path.resolve(__dirname, 'sent_news.json');
let sentNews = [];

// Carrega histórico de IDs já enviados
if (fs.existsSync(sentNewsFile)) {
  sentNews = JSON.parse(fs.readFileSync(sentNewsFile, 'utf-8'));
}

// ——————————————————————————————————————————————
// UTILITÁRIOS
// ——————————————————————————————————————————————
async function translateText(text) {
  try {
    const res = await translate(text, { to: 'pt' });
    return res.text;
  } catch (err) {
    logger.error(`Erro na tradução: ${err.message}`);
    return text;
  }
}

async function getCryptoPanicNews() {
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&kind=news&regions=pt`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return Array.isArray(json.results) ? json.results : [];
  } catch (err) {
    logger.error(`Erro ao buscar CryptoPanic: ${err.message}`);
    return [];
  }
}

async function sendNewsToTelegram(news) {
  for (const article of news) {
    const id = article.id;
    if (sentNews.includes(id)) continue;

    const rawTitle = article.title;
    const link = article.url;
    const title = await translateText(rawTitle);

    const message = `<b>${title}</b>\n\n<a href=\"${link}\">Leia mais</a>`;

    try {
      await bot.sendMessage(
        TG_GROUP_ID,
        message,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          message_thread_id: TG_TOPIC_ID
        }
      );
      sentNews.push(id);
      fs.writeFileSync(sentNewsFile, JSON.stringify(sentNews, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`Erro ao enviar notícia: ${err.message}`);
    }
  }
}

// ——————————————————————————————————————————————
// LOOP PRINCIPAL
// ——————————————————————————————————————————————
let firstRun = true;

async function main() {
  try {
    const allNews = await getCryptoPanicNews();

    if (firstRun) {
      const initialBatch = allNews.slice(0, 5).reverse();
      if (initialBatch.length > 0) {
        await sendNewsToTelegram(initialBatch);
      }
      firstRun = false;
    } else {
      const fresh = allNews.filter(a => !sentNews.includes(a.id));
      if (fresh.length > 0) {
        await sendNewsToTelegram(fresh);
      }
    }
  } catch (err) {
    logger.error(`Erro no loop principal: ${err.message}`);
  }

  setTimeout(main, 60 * 1000);
}

main();