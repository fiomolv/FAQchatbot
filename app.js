'use strict';
// Reference the packages we require so that we can use them in creating the bot
const builder = require('botbuilder');
const restify = require('restify');
const apiairecognizer = require('./apiairecognizer');
const MongoClient = require('mongodb').MongoClient;

// Config variables set in Heroku
const MICROSOFT_APP_ID = process.env.MICROSOFT_APP_ID;
const MICROSOFT_APP_PASSWORD = process.env.MICROSOFT_APP_PASSWORD;
const DIALOGFLOW_TOKEN = process.env.DIALOGFLOW_TOKEN;
const recognizer = new apiairecognizer(DIALOGFLOW_TOKEN);
const DB_PASSWORD = process.env.DB_PASSWORD;

var db;

// Initialize database connection
// MongoClient.connect('mongodb://admin:' + DB_PASSWORD + '@ds042729.mlab.com:42729/botlog', {
//     poolSize: 50
// }, function(err, database) {
//     if (err) throw err;
//     db = database;
// });

// =========================================================
// Bot Setup
// =========================================================
// Listen for any activity on port 3978 of our local server

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978,
    function () {
        console.log('%s listening to %s', server.name, server.url);
    });

// Create chat bot
var connector = new builder.ChatConnector({
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);

// If a Post request is made to /api/messages on port 3978 of our local server, then we pass it to the bot connector to handle
server.post('/api/messages', connector.listen());

// =========================================================
// Bots Dialogs
// =========================================================
// This is called the root dialog. It is the first point of entry for any message the bot receives

var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

// Add dialogflow intent name in this list:
const intentsList = [
    'Default Welcome Intent',
    'Default Fallback Intent',
    'Default Goodbye Intent',

    // main menu
    'main-acct openclose',
    'main-billing',

    // account open close matters:
    // account opening; account closing; gas supply matters; security deposit
    'acct_openclose-opening account',
    'acct_openclose-opening account - commercial',
    'acct_openclose-opening account - residential',
    'acct_openclose-closing account',
    'acct_openclose-closing account - personal name',
    'acct_openclose-closing account - company name',
    'acct_openclose-gas supply matters',
    'acct_openclose-gas supply matters-gas turn on',
    'acct_openclose-gas supply matters-temp gas termination',
    'acct_openclose-security deposit',
    'acct_openclose-security deposit - residential SD',
    'acct_openclose-security deposit - commercial SD'
];

bot.dialog('/', intents);
intents.matchesAny(intentsList, function(session, args) {
    // console.log(args);
    messageHandler(session, builder, args);
});

// Handles DialogFlow intents messages
function messageHandler(session, builder, args) {
    let messages = args.entities[0].response.messages;
    messages.forEach((message) => {
        switch (message.type) {
            case 0: // text
                session.send(message.speech);
                break;
            case 1: // card
                let card = new builder.Message(session)
                    .addAttachment({
                        contentType: "application/vnd.microsoft.card.adaptive",
                        content: {
                            type: "AdaptiveCard",
                            body: [
                                {
                                    "type": "TextBlock",
                                    "text": message.title,
                                    "size": "large",
                                    "weight": "bolder"
                                },
                                {
                                    "type": "TextBlock",
                                    "text": message.subtitle
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.OpenUrl",
                                    "method": "POST",
                                    "url": message.buttons[0].postback,
                                    "title": message.buttons[0].text
                                }
                            ]
                        }
                    });
                session.send(card);
                session.endDialog();
                break;
            case 2: // quick replies
                builder.Prompts.choice(session, message.title, message.replies, { listStyle: 3 });
                session.endDialog();
                break;
        }
    })
}


// log conversation into database
// function logConversation(context, time, input, reason, db) {
//     let newdoc = {
//         context: context,
//         time: time,
//         userinput: input,
//         reason: reason
//     };
//     console.log(newdoc);
//     db.collection("conversation_log").insert(newdoc, {
//         w: 1
//     });
// }
