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
  
  subClient.subscribe('harvest_line', message => {
    console.log('Received Redis message', message);
   
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

    pubClient.publish('processed_havest', `ACK: Updated ${obj.fruit}, ${obj.month} tallies`);
    
  });
});