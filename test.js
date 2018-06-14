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
    'acct_openclose-opening account - residential',
    'acct_openclose-closing account',
    'acct_openclose-closing account - personal name',
    'acct_openclose-closing account - company name',
    'acct_openclose-gas supply matters',
    'acct_openclose-gas supply matters-gas turn on'
];

bot.dialog('/', intents);
intents.matchesAny(intentsList, function(session, args) {
    // console.log(args.entities[0].response.messages);
    messageHandler(session, builder, args);
});

// Handles DialogFlow intents messages
function messageHandler(session, builder, args) {
    let messages = args.entities[0].response.messages;
    messages.forEach((message) => {
        // console.log(message.buttons);
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
                builder.Prompts.choice(session, message.title, message.replies); // { listStyle: 3 }
                session.endDialog();
                break;
        }
    })
}
