"use strict"
import promptSync from "prompt-sync";
import Sugar from "sugar";

// Imitate a system with a dynamic time slots for doctors
const availableDoctors = { 
  "josh": "Josh Stammer, M.D.", 
  "christine":"Christine Collins, M.D.", 
  "abraham": "Abraham Brown, M.D."
};


/**
 * A class representing a user in a chat with a bot
 */
class User {
  /**
   * Create an instance of User
   * @param {NlpManager} manager - instance of the main class in NLP.js library.
   * @param {function} postOutput - a function with one parameter (string), which will post the answer or log it
   * @param {String} nextIntent - if not undefined, will overwrite the next message's intent. Is used to create logical flow in the conversation
   */
  constructor(manager, getInput = promptSync(), postOutput = console.log) {
    this.manager = manager;
    this.postOutput = postOutput;
    this.nextIntent;
  }

  /**
   * Give additional behavior to intents:
   * - Send results to APIs
   * - Input custom variables to answers
   * - Create conversational flow & ask for additional info in case needed
   * @param {Object} input - an object, which is the output of NlpManager's process method
   * @returns {Object} - the same object as in the input but with possibly changed attributes such as "answer"
   */
  async onIntent(input) {
    const output = input;

    // Check if output has to be a logical continuation of the prior conversation's flow.
    // If it is, change the classified intent to the predefined one.
    if (this.nextIntent) {
      output.intent = this.nextIntent;
      this.nextIntent = undefined;
    }
    
    // Check if the user want to book something
    if (output.intent === 'user.book') {

      if (output.entities) {
        // Go throught all found entities and add the important ones to instance variables
        for (let i = 0; i < output.entities.length; i++) {
          switch(output.entities[i].entity) {
            case "doctor":
              this.doctor = output.entities[i].option;
              break;
            case "date":
              this.date = output.entities[i].sourceText;
              break;
            case "datetime":
              this.datetime = output.entities[i].sourceText;
              break;
            case "time":
              this.time = output.entities[i].sourceText;
              break;
          }
        }
      }

      // All the required data to book is present => process the reservation
      if (this.doctor && (this.datetime || (this.date && this.time))) {

        // If the user gave date & time separately, join them. If not, send the whole datetime
        let textDate;
        if (this.datetime) {
          textDate = this.datetime;
        } else {
          textDate = this.date + " " + this.time;
        }
        textDate = this.constructor.processDate(textDate);

        // If the passed date or time are incorrect (e.g. are past)
        if (textDate === undefined) {

          output.answer = "Sorry, you've provided an unavailable time or date. Please repeat again";
          this.date = this.time = this.datetime = undefined;
          this.nextIntent = "user.book";

        } else {

          // Imitate sending the booking info to an API
          console.log("## The request is sent to API");
          output.answer = `Your reservation with ${availableDoctors[this.doctor]} was made. Time: ${textDate.toString()}. Thanks for working with us!`;

          // Rewriting the variables to give user the ability to book more than once
          this.doctor = undefined;
          this.date = this.datetime = this.time = undefined;
          
        }

      // Not all data required to make a reservation is present => Iterate until it is
      // The iteration is done by means of the variable "nextIntent", which will
      // explicitly tell that the next message's intent also refers to booking (or other intents)
      } else {
        this.nextIntent = "user.book";
        output.answer = "Sorry, you have to specify";

        // The user hasn't provided the name of the doctor => Ask them to choose
        // out of the available ones
        if (!(this.doctor)) {
          var outputString = "Please choose the doctor out of the available:\n";
          for (let i = 0; i < Object.keys(availableDoctors).length; i++) {
            outputString += availableDoctors[Object.keys(availableDoctors)[i]] + "\n";
          }
          output.answer = outputString;
          return output;
        }
        if (!(this.date)) {
          output.answer = "Please enter the date";
          return output;
        }
        if (!(this.time)) {
          output.answer = "Please enter the time";
          return output;
        }
      }
      
      // If the user's intent is to talk to a human operator, redirect the chat
    } else if (output.intent === "user.redirect") {
      output.answer = "Redirecting to a human manager";

      // Imitate passing the chat to a human operator
      console.log("## Passing the chat over to a human manager");

    } else if (output.intent === undefined) {
      output.answer = "Sorry, I didn't quite get you. Could your paraphrase it?"
    }
    return output;
  }

  /**
   * Translate a string to a datetime formant
   * @param {String} textDate - The string from which to extract the datetime
   * @returns {Date} - a js Date representing the datetime of the appointment.
   * Return undefined if the datetime is past
   */
  static processDate(textDate) {
    let date = Sugar.Date.create(textDate);
    let now = new Date();
    if (now > date) {
      return undefined
    } else {
      return date;
    }
  }
}

export {
  availableDoctors,
  User
}