var builder = require('botbuilder');
var apiairecognizer = require('./apiairecognizer');
const DIALOGFLOW_TOKEN = process.env.DIALOGFLOW_TOKEN;

var connector = new builder.ConsoleConnector().listen();

var bot = new builder.UniversalBot(connector);

var recognizer = new apiairecognizer(DIALOGFLOW_TOKEN);
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

// Add dialog intent name here:
const intentsList = [
    'Default Welcome Intent',
    'Default Fallback Intent',
    'Default Goodbye Intent',
    'main-acct openclose',
    'main-billing',
    'acct_openclose-opening account',
    'acct_openclose-opening account - commercial',
    'acct_openclose-opening account - residential'
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
