//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require('os').cpus().length/2, 2); //Minimum of two workers by default
const GATEWAY_PORT = 3000;

//Node core

const cluster = require('cluster');
const compression = require('compression');

//Redis configuration
const REDIS_HOST = 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = { url: `redis://${REDIS_HOST}:${REDIS_PORT}` };
const redisPublisherChannel = 'redisPublisherChannel';
const redisSubscriberChannel = 'redisSubscriberChannel';

//NPM external
const express = require('express');
const api_router = require('express-routemagic');

if (cluster.isMaster) {
  // we create a HTTP server, but we do not use listen
  // that way, we have a socket.io server that doesn't accept connections
  var server = require('http').createServer();
  var socketIO = require('socket.io');
  var io = socketIO().listen(server);
  var redis = require('socket.io-redis');

  io.adapter(redis(REDIS_URL));

  setInterval(function() {
    // all workers will receive this in Redis, and emit
    io.emit('data', 'payload');
  }, 1000);

  for (var i = 0; i < numClusterWorkers.length; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  }); 
}

if (cluster.isWorker) {
  var app = express();
  //Pull in routes
  api_router.use(app);
  var http = require('http');
  var server = http.createServer(app);
  var io = require('socket.io').listen(server);
  var redis = require('socket.io-redis');

  io.adapter(redis({ host: 'localhost', port: 6379 }));
  io.on('connection', function(socket) {
    socket.emit('data', 'connected to worker: ' + cluster.worker.id);
  });

  app.listen(GATEWAY_PORT);
}