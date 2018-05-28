/*jshint esversion: 6 */
/*jslint node: true */
'use strict';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const logic = require('./logic');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && !event.message.is_echo ||
                    event.postback && event.postback.payload) {
                    logic.receivedMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});

// /* Webhook for API.ai to get response from the 3rd party API */
// app.post('/ai', (req, res) => {
//     logic.getResponseByAction(req.body, db).then((result) => {
//         return res.json(result);
//     }).catch(e => {
//         console.error(e);
//     });
// });