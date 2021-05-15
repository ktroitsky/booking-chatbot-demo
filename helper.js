"use strict"
import Sugar from "sugar";

// Extend the built-in Date to add a few methods from Sugar's library
Sugar.Date.extend()

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
   * @param {String} postOutput - a string that lets you choose how an instance
   * will be able to send responses to user. Options:
   * - "console" (Default) - console.log(response)
   * - "tg" - send the data to telegram. In this case, you have to specify the 
   * property "chatid". Otherwise, "console" will be set.
   * @param {String} nextIntent - if not undefined, will overwrite the next message's intent. 
   * Is used to create logical flow in the conversation
   * @param {Date} date - represents the date of the appointment (time - 00:00)
   * @param {number} time - represents the offset in ms from the beginning of the day
   * @param {Date} datetime - represents the date & the time of the appointment
   * @param {Date} chatid - Telegram chat ID of the user
   */
  constructor(manager, postOutput = console.log, chatid = undefined) {
    this.manager = manager;
    this.nextIntent;
    this.date;
    this.time;
    this.datetime;
    this.chatid = chatid;
    if (postOutput === "tg") {
      this.postOutput = async function(text) {
        await this.constructor.bot.sendMessage(this.chatid, text);
      }
    } else {
      this.postOutput = console.log;
    } 
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
              let reservationDate = output.entities[i].sourceText;
              reservationDate = this.constructor.processDate(reservationDate);
              this.date = reservationDate;
              break;
            case "datetime":
              let reservationDatetime = output.entities[i].sourceText;
              reservationDatetime = this.constructor.processDate(reservationDatetime);
              this.datetime = reservationDatetime;
              break;
            case "time":
              let reservationTime = output.entities[i].sourceText;
              reservationTime = this.constructor.processDate(reservationTime, true);
              this.time = reservationTime;
              break;
          }
        }
      }

      // All the required data to book is present => process the reservation
      if (this.doctor && (this.datetime || (this.date && this.time))) {

        // If the user gave date & time separately, join them. If not, use the datetime
        let finalDatetime;
        if (this.datetime) {
          finalDatetime = this.datetime;
        } else {
          finalDatetime = this.date.advance(this.time);
        }

        // If the passed date or time are past
        if (finalDatetime < Date.now()) {

          output.answer = "Sorry, you've provided an unavailable time or date. Please repeat again";
          this.date = this.time = this.datetime = undefined;
          this.nextIntent = "user.book";

        } else {

          // Imitate sending the booking info to an API
          this.postOutput("## The request is sent to API");
          output.answer = `Your reservation with ${availableDoctors[this.doctor]} was made. `
                          + `Time: ${finalDatetime.toString()}. Thanks for working with us!`;

          // Rewriting the variables to give the user the ability to book more than once
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
        // The user hasn't given the date or time. Ask them about it, while 
        // staying on "user.book" intent.
        if (!(this.date)) {
          output.answer = "Please enter the date";
          this.nextIntent = "user.book";
          return output;
        }
        if (!(this.time)) {
          output.answer = "Please enter the time";
          this.nextIntent = "user.book";
          return output;
        }
      }
      
      // If the user's intent is to talk to a human operator, redirect the chat
    } else if (output.intent === "user.redirect") {
      output.answer = "Redirecting to a human manager";

      // Imitate passing the chat to a human operator
      this.postOutput("## Passing the chat over to a human manager");

    } else if (output.intent === "None") {
      output.answer = "Sorry, I didn't quite get you. Could your paraphrase it?"
    }
    return output;
  }

  /**
   * Translate a natural language string to a Date format
   * @param {String} textDate - the string from which to extract the datetime
   * @param {Boolean} isTime - if set to true, process the string as a time, 
   * in which case only the time offset in miliseconds from the beginning of 
   * the day will be returned.
   * @returns {Date} - js Date or number. If isTime, returns offset in miliseconds.
   * If not isTime, returns a Date
   */
  static processDate(textDate, isTime = false) {
    let date = Date.create(textDate);

    if (isTime) {
      let dayStartTime = date.clone();

      // Is modified in-place
      dayStartTime.beginningOfDay();
      return date - dayStartTime;
    }
    return date;
  }
}

export {
  availableDoctors,
  User
}