"use strict"
import { NlpManager } from "node-nlp";
import { User } from "./user.js";
import TeleBot from "telebot";
import dotenv from "dotenv";
dotenv.config()

// Imitate a database with user info. Key: Telegram chat id. Value: User instance
const userDatabase = {};

const manager = new NlpManager({ languages: ['en'], forceNER: true });
const bot = new TeleBot(process.env.BOT_TOKEN);

// As the bot is the same for all User instances, set the bot as a class property
User.bot = bot;

// Load the model. Then connect to the Telegram bot
(async() => {
  // Change to these lines in case there are any changes in the corpus
  // manager.addCorpus("corpus.json");
  // await manager.train();
  // manager.save()
  manager.load();

  bot.on('text', async function(msg) {
    let response;
    let chatid = msg.chat.id;

    // If the user doesn't yet exist in out database, add them
    if (!(chatid in userDatabase)) {
      userDatabase[chatid] = new User(manager, "tg", chatid);
    }

    if (msg.text === "/start") {
      await msg.reply.text("Hello! My name's Booker. How can I help you?");

    } else {
      response = await manager.process('en', msg.text);
      response = await userDatabase[chatid].onIntent(response);
 
      await msg.reply.text(response.answer);
    }
  });

  bot.start();

})();