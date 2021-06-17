'use strict';

const config = require("./config");
const express = require('express');
const app = express();
const uuid = require('uuid');
const path = require('path');

const dFService = require('./services/dialogflow-service');
const weatherService = require('./services/weather-service');

//Check missing config keys
if (!config.GOOGLE_PROJECT_ID) {
  throw new Error('missing GOOGLE_PROJECT_ID');
}
if (!config.DF_LANGUAGE_CODE) {
  throw new Error('missing DF_LANGUAGE_CODE');
}
if (!config.GOOGLE_CLIENT_EMAIL) {
  throw new Error('missing GOOGLE_CLIENT_EMAIL');
}
if (!config.GOOGLE_PRIVATE_KEY) {
  throw new Error('missing GOOGLE_PRIVATE_KEY');
}
if (!config.WEATHER_API_KEY){
  throw new Error('missing WEATHER_API_KEY');
}

const port = process.env.PORT || 5000;

app.set('port', port);

//serve static files in the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Process application/x-www-form-urlencoded
app.use(express.urlencoded({
    extended: false
}));

// Process application/json
app.use(express.json());

// Index route
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'index.html'));
})

app.listen(port, () => {
  console.log('Express server listening on port', port)
});


const sessionIds = new Map();

function setSessionAndUser(senderID) {
  if (!sessionIds.has(senderID)) {
      sessionIds.set(senderID, uuid.v4());
  }
}

function isDefined(obj) {
  if (typeof obj == 'undefined') {
      return false;
  }

  if (!obj) {
      return false;
  }

  return obj != null;
}

function handleMessage(senderID, messages){
  //console.log("Messages2: "+messages);
  return messages;
}

async function handleDialogFlowAction(senderID, action, messages, parameters){
  // console.log("Action: "+action);
  // console.log("Messages: "+messages);
  //console.log("Parameters: "+parameters.fields['geo-city'].stringValue);
  switch(action){
    case 'get-current-weather':
      if ( parameters.fields['geo-city'].stringValue!='') {

        let weatherResponse = await weatherService(parameters.fields['geo-city'].stringValue)
        //console.log(weatherResponse);
        if (!weatherResponse) {
            return handleMessage(senderID,
                `No weather forecast available for ${parameters.fields['geo-city'].stringValue}`);
        } else {
            let reply = `${messages} ${weatherResponse}`;
            //console.log(reply);
            return handleMessage(senderID, reply);
        }

    } else {
        return handleMessage(senderID, messages);
    }
    break;

    default:
      return handleMessage(senderID, messages);
  }
}

async function handleDialogFlowResponse(senderID, response){
  let responseText = response.fulfillmentMessages[0].text.text[0];
  let action = response.action;
  let parameters = response.parameters;

  // console.log("Res: "+responseText);
  // console.log("Act: "+action);

  if(isDefined(action)){
    return await handleDialogFlowAction(senderID, action, responseText, parameters);
  }
  else if(responseText){
    return handleMessage(senderID, responseText);
  }

}

async function sendMessages(messages){
  setSessionAndUser(123456789);
  //console.log("You: "+messages);
  let response =  await dFService.sendTextQueryToDialogFlow(sessionIds, 123456789, messages);
  
  return handleDialogFlowResponse(123456789, response.result);
}

app.post('/responses', async function(req, res){
    let userMessage = req.body.message;
    let response = "";
    //console.log("Messages: "+userMessage)
    response = await sendMessages(userMessage);
    //console.log("Response Test:" + response);
    //responseText = result.fulfillmentMessages[0].text.text[0];
    res.send({"response": response});
})