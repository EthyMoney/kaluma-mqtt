# kaluma-mqtt
 Kaluma library for the MQTT protocol


### This library is NOT stable and still very much active development. DO NOT use until this is updated to say so.

# Basic Example:
```javascript
const { WiFi } = require('wifi');
const { MQTTClient } = require('mqtt');

const wifi = new WiFi();
var mqttClient = new MQTTClient('myClientId', 'myBrokerIp');


// Connect to WiFi and then connect to MQTT broker
wifi.connect({ ssid: 'my-wifi-name', password: 'my-password' }, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('connected to wifi, connecting to mqtt broker');
    mqttClient.connect();
  }
});


// MQTT client event handlers
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// data is an object that contains the message and topic as properties
mqttClient.on('message', (data) => {
  console.log('Received message:', data.message.toString(), 'on topic:', data.topic);
});

mqttClient.on('disconnect', () => {
  console.log('Disconnected from MQTT broker');
});

mqttClient.on('error', (err) => {
  console.error('Error:', err);
});

```
