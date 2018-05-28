'use strict';
const FB_PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DIALOGFLOW_DEVELOPER_TOKEN = process.env.DIALOGFLOW_DEVELOPER_TOKEN;
const uuid = require('uuid');
const apiai = require('apiai');
const request = require('request');
const async = require('async');
const apiaiApp = apiai(DIALOGFLOW_DEVELOPER_TOKEN);
const messagesDelay = 500;

class Logic {
    constructor() {
        this.fbids = new Map();
        this.sessions = {};
    }

    receivedMessage(event) {
        const sender = event.sender.id;

        if (!this.fbids.has(sender)) {
            this.fbids.set(sender, uuid.v4());
        }

        if (event.message) {
            // Handle a text message from this sender
            if (event.message.text) {
                const text = event.message.text;
                this.sendTextToAI(sender, event, text);
            }
        }
    }

    sendTextToAI(sender, event, text, source = "facebook") {
        let apiai = apiaiApp.textRequest(text, {
            sessionId: this.fbids.get(sender),
            originalRequest: {
                data: event,
                source: source
            }
        });

        apiai.on('response', (response) => {
            let messages = response.result.fulfillment.data || response.result.fulfillment.messages;
            this.handleMessages(sender, messages);
        });

        apiai.on('error', (error) => {
            console.log(error);
        });

        apiai.end();
    }

    handleMessages(sender, messages) {
        let facebookMessages = [],
            senderAction = this.prepareSenderAction(sender, "typing_on");

        if (!Array.isArray(messages)) {
            messages = [messages];
        }

        messages.forEach((message) => {
            let facebookMessage;

            switch (message.type) {
                case 'quickreplies':
                    facebookMessage = this.prepareQuickReplies(sender, message);
                    break;
                case 'text':
                    facebookMessage = this.prepareTextMessage(sender, message.text);
                    break;
                default:
                    facebookMessage = this.prepareTextMessage(sender, message.speech);
                    break;
            }
            facebookMessages.push(facebookMessage);
        });

        return new Promise((resolve, reject) => {
            async.eachSeries(facebookMessages, (msg, callback) => {
                    this.sendMessage(senderAction)
                        .then(() => this.sleep(messagesDelay))
                        .then(() => this.sendMessage(msg))
                        .then(() => callback())
                        .catch(callback);
                },
                (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.log('Messages sent');
                        resolve();
                    }
                }
            );
        });

    }

    sleep(delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(), delay);
        });
    }

    sendMessage(messageData) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: { access_token: encodeURIComponent(FB_PAGE_TOKEN) },
                method: 'POST',
                json: messageData
            }, (error, response) => {
                if (error) {
                    console.log('Error sending message: ', error);
                    reject(error);
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                    reject(new Error(response.body.error));
                }

                resolve();
            });
        });
    }

    //facebook text message template
    prepareTextMessage(sender, aiText) {
        let messageData = {
            recipient: { id: sender },
            message: { text: aiText }
        };
        return messageData;
    }

    //facebook sender action template : typing indicators etc
    prepareSenderAction(sender, senderAction) {
        let messageData = {
            recipient: { id: sender },
            sender_action: senderAction
        };
        return messageData;
    }

    //facebook quick reply buttons template
    prepareQuickReplies(sender, message) {
        let messageData = {
            recipient: { id: sender },
            message: { text: message.title, quick_replies: [] }
        };

        message.replies.forEach((reply) => {
            let contentType = "text";
            if (reply === "SEND_LOCATION") {
                contentType = "location";
            }
            messageData.message.quick_replies.push({
                content_type: contentType,
                title: reply,
                payload: reply
            });
        });
        return messageData;
    }

    //facebook carousel cards template
    // prepareCards(sender) {
    //     let messageData = {
    //         recipient: { id: sender },
    //         message: {
    //             "attachment": {
    //                 "type": "template",
    //                 "payload": {
    //                     "template_type": "generic",
    //                     "elements": []
    //                 }
    //             }
    //         }
    //     };
    //     return messageData;
    // }

    setTypingIndicator(sessionId){
        for (var [key, value] of this.fbids.entries()) {
            if(value === sessionId){
                this.sendMessage(this.prepareSenderAction(key, "typing_on"));
            }
        }
    }

    //api.ai fulfillment
    // getResponseByAction(event) {
    //     let action = event.result.action,
    //         result = event.result,
    //         json = null,
    //         messages = [];
    //
    //     this.setTypingIndicator(event.sessionId);
    //
    //     return new Promise((resolve, reject) => {
    //         //store address in context
    //         if (result.parameters.address && result.parameters.address !== "") {
    //             this.setAddressContext(event.sessionId, result.parameters.address);
    //         }
    //         switch (action) {
    //             case 'input.address':
    //                 async.waterfall([
    //                     (callback) => {
    //                         Util.getAddress(result.parameters.address).then((addressResult) => {
    //                             if (addressResult) {
    //                                 let coordinates = addressResult.X + ',' + addressResult.Y;
    //                                 callback(null, coordinates);
    //                             }
    //                         }).catch((e) => {
    //                             console.error(e);
    //                         });
    //                     },
    //                     (coordinates, callback) => {
    //                         HousingGuidelines.getArea(coordinates).then((area) => {
    //                             let response = {
    //                                 text: area.string,
    //                                 type: 'text'
    //                             };
    //                             let quickreplies = this.getInterestQuickReplies();
    //                             messages = [response, quickreplies];
    //
    //                             json = {
    //                                 data: messages,
    //                                 source: 'address'
    //                             };
    //
    //                             callback(null, json);
    //                         }).catch((e) => {
    //                             console.error(e);
    //                         });
    //                     }
    //                 ], (err, result) => {
    //                     if (err) {
    //                         console.error(err);
    //                         reject(err);
    //                     } else {
    //                         resolve(result);
    //                     }
    //                 });
    //                 break;
    //             case 'input.guidelines':
    //                 let guideline = result.parameters.guidelines,
    //                     address = result.parameters.address;
    //
    //                 if (address === "") {
    //                     address = this.getContext(event.sessionId).address;
    //                 }
    //
    //                 if (address) {
    //                     HousingGuidelines.getHousingGuidelines('', guideline).then((resolvedGuideline) => {
    //                         let splittedText = Util.splitString(resolvedGuideline, 599);
    //
    //                         splittedText.forEach(s => {
    //                             messages.push({ text: s, type: 'text' });
    //                         });
    //
    //                         let quickreplies = this.getPostResponseQuickReplies();
    //                         messages.push(quickreplies);
    //
    //                         json = {
    //                             data: messages,
    //                             source: 'guidelines'
    //                         };
    //
    //                         resolve(json);
    //                     }).catch((e) => {
    //                         console.error(e);
    //                     });
    //                 } else {
    //                     async.waterfall([
    //                         (callback) => {
    //                             Util.getAddress(result.parameters.address).then((addressResult) => {
    //                                 if (addressResult) {
    //                                     let coordinates = addressResult.X + ',' + addressResult.Y;
    //                                     callback(null, coordinates);
    //                                 }
    //                             }).catch((e) => {
    //                                 console.error(e);
    //                             });
    //                         },
    //                         (coordinates, callback) => {
    //                             HousingGuidelines.getArea(coordinates).then((area) => {
    //                                 area = {
    //                                     text: area.string,
    //                                     type: 'text'
    //                                 };
    //                                 messages.push(area);
    //
    //                                 callback(null, area);
    //
    //                             }).catch((e) => {
    //                                 console.error(e);
    //                             });
    //                         },
    //                         (area, callback) => {
    //                             HousingGuidelines.getHousingGuidelines('', guideline).then((resolvedGuideline) => {
    //                                 let splittedText = Util.splitString(resolvedGuideline, 599);
    //
    //                                 splittedText.forEach(s => {
    //                                     messages.push({ text: s, type: 'text' });
    //                                 });
    //
    //                                 let quickreplies = this.getPostResponseQuickReplies();
    //                                 messages.push(quickreplies);
    //
    //                                 json = {
    //                                     data: messages,
    //                                     source: 'guidelines'
    //                                 };
    //
    //                                 callback(null, json);
    //                             }).catch((e) => {
    //                                 console.error(e);
    //                             });
    //                         }
    //                     ], (err, result) => {
    //                         if (err) {
    //                             console.error(err);
    //                             reject(err);
    //                         } else {
    //                             resolve(result);
    //                         }
    //                     });
    //                 }
    //                 break;
    //             case 'input.planningdecision':
    //                 let planningDecisionsAddress = result.parameters.address;
    //
    //                 if (planningDecisionsAddress === "") {
    //                     planningDecisionsAddress = this.getContext(event.sessionId).address;
    //                 }
    //
    //                 async.waterfall([
    //                     (callback) => {
    //                         PlanningDecisions.getPlanningDecisions(planningDecisionsAddress).then((resolvedDecisions) => {
    //                             if (Array.isArray(resolvedDecisions) && resolvedDecisions.length > 0) {
    //                                 let chunkedArray = Util.splitArray(resolvedDecisions, 10);
    //
    //                                 chunkedArray.forEach((chunk) => {
    //                                     messages.push({ list: chunk, type: 'planningDecisions' });
    //                                 });
    //                             } else {
    //                                 messages.push({
    //                                     text: `No planning decisions found for ${planningDecisionsAddress}`,
    //                                     type: 'text'
    //                                 });
    //                             }
    //
    //                             let quickreplies = this.getPostResponseQuickReplies();
    //                             messages.push(quickreplies);
    //
    //                             json = {
    //                                 data: messages,
    //                                 source: 'planningdecisions'
    //                             };
    //                             callback(null, json);
    //                         }).catch((e) => {
    //                             console.error(e);
    //                         });
    //                     }
    //                 ], (err, result) => {
    //                     if (err) {
    //                         console.error(err);
    //                         reject(err);
    //                     } else {
    //                         resolve(result);
    //                     }
    //                 });
    //                 break;
    //             case 'input.houseattributes':
    //                 let attributes = result.parameters.HouseAttributes,
    //                     addr = result.parameters.address;
    //
    //                 async.waterfall([
    //                     (callback) => {
    //                         Util.getAddress(addr).then((addressResult) => {
    //                             if (addressResult) {
    //                                 let coordinates = addressResult.X + ',' + addressResult.Y;
    //                                 callback(null, coordinates);
    //                             }
    //                         }).catch((e) => {
    //                             console.error(e);
    //                         });
    //                     },
    //                     (coordinates, callback) => {
    //                         HousingGuidelines.getArea(coordinates).then((area) => {
    //                             let attr = (area.raw.attributes[attributes.toUpperCase()]).toLowerCase();
    //
    //                             area = {
    //                                 text: `${addr} is ${attr}`,
    //                                 type: 'text'
    //                             };
    //                             messages = [area];
    //                             json = {
    //                                 data: messages,
    //                                 source: 'houseattributes'
    //                             };
    //
    //                             callback(null, json);
    //                         }).catch((e) => {
    //                             console.error(e);
    //                         });
    //                     }
    //                 ], (err, result) => {
    //                     if (err) {
    //                         console.error(err);
    //                         reject(err);
    //                     } else {
    //                         resolve(result);
    //                     }
    //                 });
    //                 break;
    //         }
    //         return json;
    //     });
    // }
}

module.exports = new Logic();