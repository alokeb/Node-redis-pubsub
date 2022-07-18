
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL || { host: REDIS_HOST, port: REDIS_PORT };
const downstreamRedisChannel = "downstreamRedisChannel";
const upstreamRedisChannel = "upstreamRedisChannel";

var 
    server = require('http').createServer();
    redis = require('redis'),
    client = redis.createClient(REDIS_URL);

client.subscribe(downstreamRedisChannel);
client.on("message", function(channel, message){
  console.log(channel + ": " + message);
});

server.listen(3000);
