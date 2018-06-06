'use strict';
// Reference the packages we require so that we can use them in creating the bot
const builder = require('botbuilder');
const restify = require('restify');
const apiairecognizer = require('./apiairecognizer');

// Config variables set in Heroku
const MICROSOFT_APP_ID = "80d11cf5-4542-472b-a092-f170d139beb6"||process.env.MICROSOFT_APP_ID;
const MICROSOFT_APP_PASSWORD = "piRRBSN395}@gcwhaTC66:~"|| process.env.MICROSOFT_APP_PASSWORD;
const DIALOGFLOW_TOKEN = "cfc321ce45724d9e8d52c48c28b70cf6"|| process.env.DIALOGFLOW_TOKEN;

const recognizer = new apiairecognizer(DIALOGFLOW_TOKEN);


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

bot.dialog('/', intents);

intents.matches('Default Welcome Intent', function(session, args) {
    let messages = args.entities[0].response.messages;

    messages.forEach((message) => {
        session.send(message.speech);
    })
});
