
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE || 'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE || 'processed_havest';
var serverName = process.env.NAME || 'Unknown';

//Node core
const http = require('http');
// const cluster = require('cluster');

//Setup express app
const express = require('express');
const app = express();
const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer);
  // , {
  // cors: {
  //   origin: "example.com",
  //   methods: ["GET", "POST"],
  //   credentials: true
  // }
// }
// );

//Gateway configuration
const GATEWAY_PORT = 3000;

//Redis configuration
const REDIS_URL = process.env.REDIS_URL || { url: 'redis://redis:6379' };
const redis = require('redis');
const { createAdapter } = require("@socket.io/redis-adapter"); //https://github.com/socketio/socket.io-redis-adapter#migrating-from-socketio-redis

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

//Setup Redis pub sub connections and socket.io adapter
const pubClient = redis.createClient(REDIS_URL),
      subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  pubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  subClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  io.adapter(createAdapter(pubClient, subClient));
});

//Redis healthCheck should be done via an external process, it is not a function of this gateway
//Upon failure of Redis health, appropriate actions including restarting gateway should be performed.

//Handle socket.io messages
io.on('connection', function (socket) {
  console.log('Connection just made to server:', serverName);

  socket.on('disconnect', function () {
    console.log('worker pid:', process.pid, 'connection just closed');
  });

  // socket.on('request', )

  socket.on(DOWNSTREAM_MESSAGE, function (msg) {
    console.log(msg);
    io.broadcast(DOWNSTREAM_MESSAGE, msg);
  });
  socket.on(UPSTREAM_MESSAGE, function (msg) {
    console.log(msg);
    io.emit(UPSTREAM_MESSAGE, msg);
  });
});

//Handle HTTP REST calls
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('/', function (req, res, next) {
  res.header('Content-Type: text/plain; charset=UTF-8');
  res.status(403).end('Access denied');
});

app.head('/health', function (req, res, next) {
  res.sendStatus(200);
});

app.get('/' + DOWNSTREAM_MESSAGE, function (req, res, next) {
  let payload = '{"fruit": "' + req.query.fruit + '", "month": "' + req.query.month + '"}';

  //get the data and forward it to redis directly
  pubClient.publish(DOWNSTREAM_MESSAGE, payload);

  //Listen for response from consumer and send it to http client
  subClient.subscribe(UPSTREAM_MESSAGE, message => {
    res.status(200).end(message);
  });
}); 

app.listen(GATEWAY_PORT, function () {
  console.log(`Server ${serverName} listening at port ${GATEWAY_PORT}`);
});