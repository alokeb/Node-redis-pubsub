
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';

//Node core
const http = require('http');
const cluster = require('cluster');

//Setup express app
const express = require('express');
const app = express();
const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer);

//Gateway configuration
const GATEWAY_PORT = 3000;

//Redis configuration
const REDIS_URL = process.env.REDIS_URL||{url: 'redis://redis:6379'};
const redis = require('redis');
const {createAdapter} = require("@socket.io/redis-adapter"); //https://github.com/socketio/socket.io-redis-adapter#migrating-from-socketio-redis

// Security considerations
//External
// let options = {};
// if (process.env.NODE_ENV === 'production') {                               
//   var key = fs.readFileSync(__dirname + '/../certs/selfsigned.key');
//   var cert = fs.readFileSync(__dirname + '/../certs/selfsigned.crt');
//   options = {
//     key: key,
//     cert: cert,
//   };
// }
   
 //Setup Redis pub sub connections
const httpPubClient = redis.createClient(REDIS_URL),
      httpSubClient = httpPubClient.duplicate();

Promise.all([httpPubClient.connect(), httpSubClient.connect()]).then(() => {
  httpPubClient.on('error', err => {
      console.log('Downstream Redis client connection error: ' + err);
      process.exit(-1);
  });
  httpSubClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  //Handle HTTP REST calls
  app.get('/', function(req, res) {
    res.header('Content-Type: text/plain; charset=UTF-8');
    res.status(403).end('Access denied');
  });

  app.get('/healthcheck', function(req, res) {
    res.header('Content-type: application/json; charset=UTF-8');
    const data = {
      uptime: process.uptime(),
      message: 'Ok',
      date: new Date()
    }
    
    res.status(200).end(data.toString());
  });

  app.get('/'+DOWNSTREAM_MESSAGE, function(req, res) {
    let payload = '{"fruit": "'+ req.query.fruit + '", "month": "' + req.query.month + '"}';
    
    //get the data and forward it to redis directly
    httpPubClient.publish(DOWNSTREAM_MESSAGE, payload);
    
    //Listen for response from consumer and send it to http client
    httpSubClient.subscribe(UPSTREAM_MESSAGE, message => {
      res.status(200).end(message);
    });
  }); 
});


//Setup sticky session cluster
var sticky = require('sticky-session');
//sticky.listen() will return false if Master
if (!sticky.listen(httpServer, GATEWAY_PORT)) { 
  // Master code

  httpServer.once('listening', function() {
    console.log('Gateway started on port', GATEWAY_PORT);
  });
} else {
    //Cluster worker setup and code goes here...
      
    //Setup Redis pub sub connections
    const ioPubClient = redis.createClient(REDIS_URL),
          ioSubClient = ioPubClient.duplicate();

    Promise.all([ioPubClient.connect(), ioSubClient.connect()]).then(() => {
      ioPubClient.on('error', err => {
          console.log('Downstream Redis client connection error: ' + err);
          process.exit(-1);
      });
      ioSubClient.on('error', err => {
        console.log('Upstream Redis client connection error: ' + err);
        process.exit(-1);
      });
      io.adapter(createAdapter(ioPubClient, ioSubClient));
    });
    
    //Redis healthCheck should be done via an external process, it is not a function of this gateway
    //Upon failure of Redis health, appropriate actions including restarting gateway should be performed.
   
    //Handle socket.io messages
    io.on('connection',function(socket){
      console.log('connection just made');

      socket.on('disconnect', function () {
        console.log('connection just closed');
      });

      socket.on(DOWNSTREAM_MESSAGE, function (msg) {
        console.log(msg);
        ioPubClient.publish(DOWNSTREAM_MESSAGE, msg);
      });
      
      ioSubClient.subscribe('harvest_line', message => {
        console.log('Received Redis message', message);
        socket.emit(UPSTREAM_MESSAGE, message);
      });
    });
  }