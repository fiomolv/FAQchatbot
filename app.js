'use strict';
// Reference the packages we require so that we can use them in creating the bot
const builder = require('botbuilder');
const express = require('express')
const restify = require('restify');

// Config variables set in Heroku
const MICROSOFT_APP_ID = "80d11cf5-4542-472b-a092-f170d139beb6" || process.env.MICROSOFT_APP_ID;
const MICROSOFT_APP_PASSWORD = "piRRBSN395}@gcwhaTC66:~" || process.env.process.env.MICROSOFT_APP_PASSWORD;

// =========================================================
// Bot Setup
// =========================================================
// Listen for any activity on port 5000 of our local server

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

// If a Post request is made to /api/messages on port 5000 of our local server, then we pass it to the bot connector to handle
/* microsoft bot framework endpoint */
server.post('/api/messages', connector.listen());

// =========================================================
// Bots Dialogs
// =========================================================
// This is called the root dialog. It is the first point of entry for any message the bot receives
bot.dialog('/', function (session) {
// Send 'hello world' to the user
    session.send("Hello World");
});