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
    console.log(args);
    let messages = args.entities[0].response.messages;

    messages.forEach((message) => {
        console.log(message);
        switch (message.type) {
            case 0:
                session.send(message.speech);
                break;
            case 2:
                console.log("quick reply");
                builder.Prompts.choice(session, message.title, message.replies);
                session.endDialog();
                break;
        }
    })
});

intents.matches('Default Fallback Intent', function(session, args) {
    let messages = args.entities[0].response.messages;

    messages.forEach((message) => {
        console.log(message);
        switch (message.type) {
            case 0:
                session.send(message.speech);
                break;
            case 2:
                console.log("quick reply");
                builder.Prompts.choice(session, message.title, message.replies);
                session.endDialog();
                break;
        }
    })
});
