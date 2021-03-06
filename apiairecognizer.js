"use strict";
var apiai = require('apiai');
const uuid = require('uuid');

let id = uuid();

var ApiAiRecognizer = function(token){
    this.app = apiai(token);
};

ApiAiRecognizer.prototype.recognize = function (context, done){
    var intent = { score: 0.0 };
    if (context.message.text){
        var request = this.app.textRequest(context.message.text.toLowerCase(),{sessionId: id});

        request.on('response', function(response){
            var result = response.result;

            if (result.source == 'agent'){
                var entities_found = [
                    {
                        entity: result.fulfillment.speech,
                        type: 'fulfillment',
                        startIndex: -1,
                        endIndex: -1,
                        score: 1,
                        response: result.fulfillment
                    },
                    {
                        entity: result.actionIncomplete,
                        type: 'actionIncomplete',
                        startIndex: -1,
                        endIndex: -1,
                        score: 1,
                        response: result.fulfillment
                    }
                ];

                for (var key in result.parameters){
                    let entity = result.parameters[key];
                    let length = entity.length;

                    if (length > 0){
                        let type = key;
                        let score = 1;
                        let startIndex = context.message.text.indexOf(entity);
                        let endIndex = startIndex + length - 1;

                        let entity_found = {
                            entity: entity,
                            type: type,
                            startIndex: startIndex,
                            endIndex: endIndex,
                            score: score,
                            response: result.fulfillment
                        };

                        entities_found.push(entity_found);
                    }
                }
                intent = { score: result.score, intent: result.metadata.intentName, entities: entities_found};
            }
            done(null, intent);
        });

        request.on('error', function(error){
            console.log(error);
            done(error);
        });

        request.end();
    }
}

module.exports = ApiAiRecognizer;