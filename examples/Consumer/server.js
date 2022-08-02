const { Emitter } = require('@socket.io/redis-emitter');
const { createClient } = require('redis');

const pubClient = createClient({ url: "redis://redis:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  pubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
  });
  subClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
  });
  
  const emitter = new Emitter(pubClient);
  subClient.subscribe('harvest_line', message => {
    console.log('Received Redis message', message);
  });
});