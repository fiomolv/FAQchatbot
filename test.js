var builder = require('botbuilder');
var apiairecognizer = require('./apiairecognizer');
const DIALOGFLOW_TOKEN = process.env.DIALOGFLOW_TOKEN;

var connector = new builder.ConsoleConnector().listen();

var bot = new builder.UniversalBot(connector);

var recognizer = new apiairecognizer(DIALOGFLOW_TOKEN);
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

bot.dialog('/', intents);
intents.matches('Default Welcome Intent', function(session, args) {
    let messages = args.entities[0].response.messages;
    console.log(args.entities[0].response);

    messages.forEach((message) => {
        session.send(message.speech);
    })
});