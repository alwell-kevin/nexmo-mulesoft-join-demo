require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;
const app = express();
const sessionHandler = require('./sessionHandler');
const mulesoftHandler = require('./mulesoft');

var Nexmo = require('nexmo');

app.use(bodyParser.json({
    type: 'application/json'
}));


var nexmo = new Nexmo({
    apiKey: process.env.NEXMO_KEY,
    apiSecret: process.env.NEXMO_SECRET
});

app.all('/inbound', (req, res) => {
    console.log("Inbound message received: ", req.query);
    sessionHandler.handleSession(req.query).then(function(session) {
        console.log("IN SEND MESSAGE RESPONSE: ", session);
        var msg;
        //New User
        if (session.init) {
            mulesoftHandler.createTicket(session);
            console.log("NEW USER in SEND MESSAGE RESPONSE: ", session)
            msg = "A support ticket has been created #15892. Would you like to be notified over WhatsApp when the ticket status changes?";
            nexmo.message.sendSms(process.env.NEXMO_NUM, session.msisdn, msg, function(err, httpResp, body) {
                if (err) {
                    console.log("sendMessagesThroughNexmo couldn't send request. error: " + err);

                }
            })
        } else {
            console.log("IN REPEAT USER: KA: ", session)

            if (session.text.toLowerCase() === "yes" || session.text.toLowerCase() === "ok") {
                sessionHandler.optIn(session);
                console.log("OPT-IN in SEND MESSAGE RESPONSE: ", session)
                msg = "Okay, you will be notified via Whatsapp. Thanks for opting in.";

                nexmo.message.sendSms(process.env.NEXMO_NUM, session.msisdn, msg, function(err, httpResp, body) {
                    if (err) {
                        console.log("sendMessagesThroughNexmo couldn't send request. error: " + err);

                    }
                })
            } else {
                if (session.text.toLowerCase() === "stop") {
                    console.log("REPEAT USER HANDLING in SEND MESSAGE RESPONSE: ", session)
                    msg = "Okay, you have been Optout."

                    nexmo.message.sendSms(process.env.NEXMO_NUM, session.msisdn, msg, function(err, httpResp, body) {
                        if (err) {
                            console.log("sendMessagesThroughNexmo couldn't send request. error: " + err);

                        }
                    })
                } else {
                    console.log("REPEAT USER HANDLING in SEND MESSAGE RESPONSE: ", session)
                    msg = "We will notify you when your ticket #15892 status changes."

                    nexmo.message.sendSms(process.env.NEXMO_NUM, session.msisdn, msg, function(err, httpResp, body) {
                        if (err) {
                            console.log("sendMessagesThroughNexmo couldn't send request. error: " + err);

                        }
                    })
                }
            }
        }
    })

    res.sendStatus(200);
});

//Test for sending data to mulesoft
app.all('/mulesoft', (req, res) => {
    console.log("MULESOFT REQUEST BODY: ", req.body);
    res.sendStatus(200);
});

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})