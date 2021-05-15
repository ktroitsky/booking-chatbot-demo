import dotenv from "dotenv";
dotenv.config()

import TeleBot from "telebot";



// console.log(process.env.BOT_TOKEN)
const bot = new TeleBot(process.env.BOT_TOKEN);

bot.on('text', (msg) => msg.reply.text(msg.text));

bot.start();