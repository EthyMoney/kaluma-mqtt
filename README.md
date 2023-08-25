# kaluma-mqtt
 Kaluma library for the MQTT protocol


### This library is NOT stable and still very much active development. DO NOT use until this is updated to say so.

# Basic Example:
```javascript
const { MQTTClient } = require('mqtt');

// must be connected to Wi-Fi prior to attempting this
var mqttClient = new MQTTClient('myClientId', 'brokerIP');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

mqttClient.on('message', (data) => {
  console.log('Received message:', data);
});

mqttClient.on('disconnect', () => {
  console.log('Disconnected from MQTT broker');
});

mqttClient.on('error', (err) => {
  console.error('Error:', err);
});

mqttClient.connect();
```
