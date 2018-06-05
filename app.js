'use strict';
// Reference the packages we require so that we can use them in creating the bot
const builder = require('botbuilder');
const express = require('express')
const bodyParser = require('body-parser');

// Config variables set in Heroku
const MICROSOFT_APP_ID = process.env.MICROSOFT_APP_ID;
const MICROSOFT_APP_PASSWORD = process.env.process.env.MICROSOFT_APP_PASSWORD;

// =========================================================
// Bot Setup
// =========================================================
// Setup Restify Server
// Listen for any activity on port 3978 of our local server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = app.listen(5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


// Create chat bot
var connector = new builder.ChatConnector({
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);

// If a Post request is made to /api/messages on port 3978 of our local server, then we pass it to the bot connector to handle
/* microsoft bot framework endpoint */
app.post('/api/messages', connector.listen());

// =========================================================
// Bots Dialogs
// =========================================================
// This is called the root dialog. It is the first point of entry for any message the bot receives
bot.dialog('/', function (session) {
// Send 'hello world' to the user
    session.send("Hello World");
});