"use strict"
import { NlpManager } from "node-nlp";
import { User } from "./helper.js";
import promptSync from "prompt-sync";

const prompt = promptSync();

const manager = new NlpManager({ languages: ['en'], forceNER: true });
const user = new User(manager);

// Train and save the model. Then iterate the conversation until the user
// enters "quit".
(async() => {
  manager.addCorpus("corpus.json");
  await manager.train();
  manager.save();

  console.log("Hello! My name's Steve. How can I help you?");
  let userInput = prompt("> ");
  let response;
  while (userInput != "quit") {
    response = await manager.process('en', userInput);
    response = await user.onIntent(response);
    console.log(response.answer);
    userInput = prompt("> ")
  }
})();