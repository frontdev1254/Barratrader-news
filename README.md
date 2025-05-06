# Crypto News Bot for Telegram

A premium crypto news bot built with Node.js that fetches the latest Portuguese news from [CryptoPanic](https://cryptopanic.com), auto-translates it, and sends it to a specific topic in a Telegram group.

## Features

- Fetches real-time crypto news via CryptoPanic API
- Automatically translates headlines to Portuguese
- Sends news to a specific topic in a Telegram group
- Avoids duplicate news with persistent tracking
- Clean and production-ready architecture
- Structured logging with Winston

## Tech Stack

- Node.js
- Telegram Bot API
- CryptoPanic API
- Google Translate API (via `@vitalets/google-translate-api`)
- Winston for professional logging

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
CRYPTOPANIC_API_KEY=your_cryptopanic_api_key
TELEGRAM_TOKEN=your_telegram_bot_token
TG_GROUP_ID=-100xxxxxxxxxx
TG_TOPIC_ID=123456
```

## Setup

```bash
git clone https://github.com/frontdev1254/crypto-news-bot.git
cd crypto-news-bot
npm install
npm start
```

> 💡 Make sure your `.env` file is properly configured before starting the bot.

## 🗂️ File Structure

```
/crypto-news-bot
├── index.js          # Main bot logic
├── logger.js         # Winston logger setup
├── sent_news.json    # Auto-generated file to track sent news (ignored by Git)
├── .env              # Environment variables (not committed)
├── LICENSE           # MIT License
├── README.md         # Project documentation
└── logs/
    └── app.log       # Log output from Winston
```

## 👤 Author

**Igor Souza** – [@frontdev1254](https://github.com/frontdev1254)

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.