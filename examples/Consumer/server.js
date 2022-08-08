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
  
  subClient.pSubscribe('harvest_line.*', (message, channel) => {
    //console.log('Received Redis message', message, ` on ${channel}`);
   
    //Just doing some random processing here... keeping a count of how many times a particular fruit and a particular month were encountered
    const obj = JSON.parse(message);
    if (!pubClient.get(obj.fruit)) {
      pubClient.set(obj.fruit, 1);
    } else {
      pubClient.incr(obj.fruit);
    }
    if (!pubClient.get(obj.month)) {
      pubClient.set(obj.month, 1);
    } else {
      pubClient.incr(obj.month);
    }

    //console.log(`Publishing to processed_harvest.${channel}`)
    pubClient.publish(`processed_havest.${channel}`, `ACK: Updated ${obj.fruit}, ${obj.month}`);
  });
});