
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL||{url: `redis://${REDIS_HOST}:${REDIS_PORT}`};
const downstreamRedisChannel = "harvest_line";
const upstreamRedisChannel = "processed_harvest";

var 
    server = require('http').createServer();
    redis = require('redis'),
    subscriber = redis.createClient(REDIS_URL),
    publisher = subscriber.duplicate();

subscriber.on('error', (err) => console.log('Redis Client Error', err));
subscriber.connect();

subscriber.subscribe('harvest_line', (message) => {
  console.log(message); // 'message'
});

subscriber.subscribe(downstreamRedisChannel);

subscriber.on('harvest_line', function(channel, message){
  //TODO: process incoming harvest

  //publisher.publish(upstreamRedisChannel, message);
});

server.listen(3000);
