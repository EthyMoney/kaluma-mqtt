var net = require('net'); // Kaluma's net module.
var { EventEmitter } = require('events'); // Kaluma's EventEmitter module.
var SimpleBuffer = require('buffer'); // Custom buffer class with basic functionality for use here.

class MQTTClient extends EventEmitter {

  constructor(clientId, brokerIp) {
    super();
    this.messageId = 1;
    this.subscriptions = [];
    this.clientId = clientId || 'kaluma-mqtt-client_' + Math.random().toString(16).substring(2, 8);
    this.broker = brokerIp || 'localhost';
    this.socket = null;
  }

  connect(port = 1883, username = null, password = null, callback = () => { }) {
    const connectPacket = {
      type: 'connect',
      clientId: this.clientId
      // We could add username, password, will, etc here.
    };
    const options = { host: this.broker, port: port };
    this.socket = net.createConnection(options, () => {
      this.send(connectPacket);
      this.emit('connect');  // Emitting the 'connect' event.
      callback();
    });
    this.socket.on('data', (data) => {
      // decode the data
      const decodedData = this.decodePacket(data);
      this.emit('message', decodedData); // Emitting the 'message' event and passing the data.
      console.log(data);
    });
    this.socket.on('end', () => {
      this.emit('disconnect');  // Emitting the 'disconnect' event.
      console.log('disconnected from server');
    });
    this.socket.on('error', (err) => {
      this.emit('error', err); // Emitting the 'error' event and passing the error object.
      console.error('Socket error:', err);
      // Handle other tasks or call error callbacks if needed
    });
  }

  publish(topic, message) {
    const publishPacket = {
      type: 'publish',
      topic: topic,
      payload: message,
      messageId: this.messageId++
      // QoS could be added here at some point.
    };
    this.send(publishPacket);
  }

  subscribe(topic) {
    const subscribePacket = {
      type: 'subscribe',
      subscriptions: [{
        topic: topic
        // QoS could be added here at some point.
      }],
      messageId: this.messageId++
    };
    this.send(subscribePacket);
  }

  send(packet) {
    const data = this.encodePacket(packet);
    this.socket.write(data);
  }

  encodePacket(packet) {
    let buffer;

    switch (packet.type) {
      case 'connect':
        const protocolName = SimpleBuffer.from('MQTT');
        const protocolLevel = new SimpleBuffer();
        protocolLevel.writeUInt8(4, 0); // MQTT 3.1.1
        const connectFlags = new SimpleBuffer();
        connectFlags.writeUInt8(0b00100000, 0); // Clean session.
        const keepAlive = new SimpleBuffer();
        keepAlive.writeUInt16BE(60, 0); // Keepalive timer in seconds.

        const clientIdBuffer = SimpleBuffer.from(packet.clientId);

        buffer = protocolName.concat(protocolLevel).concat(connectFlags).concat(keepAlive).concat(clientIdBuffer);
        break;

      case 'publish':
        const topic = SimpleBuffer.from(packet.topic);
        const messageId = new SimpleBuffer();
        messageId.writeUInt16BE(packet.messageId, 0);
        const payloadPublish = SimpleBuffer.from(packet.payload);

        buffer = topic.concat(messageId).concat(payloadPublish);
        break;

      case 'subscribe':
        const topicSubscribe = SimpleBuffer.from(packet.subscriptions[0].topic);
        const messageIdSubscribe = new SimpleBuffer();
        messageIdSubscribe.writeUInt16BE(packet.messageId, 0);
        const qosBuffer = new SimpleBuffer();
        qosBuffer.writeUInt8(0, 0);  // QoS level 0.

        buffer = messageIdSubscribe.concat(topicSubscribe).concat(qosBuffer);
        break;

      default:
        throw new Error(`Unknown packet type: ${packet.type}`);
    }

    return buffer.toBuffer();
  }

  decodePacket(data) {
    let buffer = new SimpleBuffer(data);
    let messageType = (buffer.readUInt8(0) >> 4) & 0b1111;

    let cursor = 1; // Skip the packet type and flags byte.
    let multiplier = 1;
    let length = 0;
    let digit;

    // Decode the remaining length field.
    do {
      digit = buffer.readUInt8(cursor++);
      length += (digit & 0b01111111) * multiplier;
      multiplier *= 128;
    } while ((digit & 0b10000000) !== 0);

    switch (messageType) {
      case 3:  // PUBLISH
        const topicLength = buffer.readUInt16BE(cursor);
        cursor += 2;
        const topic = buffer.slice(cursor, cursor + topicLength).toString();
        cursor += topicLength;

        let messageId;
        // If QoS > 0, get the message ID.
        if ((buffer.readUInt8(0) & 0b0110) >> 1) {
          messageId = buffer.readUInt16BE(cursor);
          cursor += 2;
        }

        const payload = buffer.slice(cursor, cursor + length - cursor).toString();

        return {
          type: 'publish',
          topic: topic,
          messageId: messageId,
          payload: payload
        };

      default:
        // Handle other message types as needed.
        console.warn(`Unhandled MQTT message type: ${messageType}`);
        return null;
    }
  }
}


exports.MQTTClient = MQTTClient;
