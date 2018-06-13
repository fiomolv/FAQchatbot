var builder = require('botbuilder');
var apiairecognizer = require('./apiairecognizer');
const DIALOGFLOW_TOKEN = 'f989016e08864e8aa9940d5f58d36800'|| process.env.DIALOGFLOW_TOKEN;

var connector = new builder.ConsoleConnector().listen();

var bot = new builder.UniversalBot(connector);

var recognizer = new apiairecognizer(DIALOGFLOW_TOKEN);
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

bot.dialog('/', intents);
intents.matches('Default Welcome Intent', function(session, args) {
    // console.log(args);
    messageHandler(session, builder, args);
});

intents.matches('Default Fallback Intent', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('Default Goodbye Intent', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('main-acct openclose', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('main-billing', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('acct_openclose-opening account', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('acct_openclose-opening account - commercial', function(session, args) {
    messageHandler(session, builder, args);
});

intents.matches('acct_openclose-opening account - residential', function(session, args) {
    messageHandler(session, builder, args);
});

// Handles DialogFlow intents messages
function messageHandler(session, builder, args) {
    let messages = args.entities[0].response.messages;
    messages.forEach((message) => {
        switch (message.type) {
            case 0: //text
                session.send(message.speech);
                break;
            case 2: //quick replies
                builder.Prompts.choice(session, message.title, message.replies); // { listStyle: 3 }
                session.endDialog();
                break;
        }
    })
}
