
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE || 'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE || 'processed_havest';
var serverName = process.env.NAME || 'Unknown';

//Node core
const http = require('http');

//Setup express app
const express = require('express');
const session = require("express-session")
let RedisStore = require("connect-redis")(session);
const app = express();
const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer, {
  transports: ["websocket"], //Polling not allowed
  cors: {
    origin: "localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

//Gateway configuration
const GATEWAY_PORT = 3000;

//Redis configuration
const REDIS_URL = process.env.REDIS_URL || { url: 'redis://redis:6379' };
const redis = require('redis');

const { createAdapter } = require("@socket.io/redis-adapter"); //https://github.com/socketio/socket.io-redis-adapter

//Use redis as session store...
const sessionStoreClient = redis.createClient(REDIS_URL);
app.use(
  session({
    store: new RedisStore({ client: sessionStoreClient }),
    saveUninitialized: false,
    secret: "grumpy gorilla",
    resave: false,
  })
);

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
const httppubClient = redis.createClient(REDIS_URL),
      httpsubClient = httppubClient.duplicate(),
      iopubClient = redis.createClient(REDIS_URL),
      iosubClient = iopubClient.duplicate();

//pub-sub clients io requests...
Promise.all([iopubClient.connect(), iosubClient.connect()]).then(() => {
  httppubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  httpsubClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
});

//Setup Redis pub sub connections
io.adapter(createAdapter(httppubClient, httpsubClient));

//Handle socket.io messages
io.on('connection', function (socket) {
  console.log(`connection made from ${socket.id}`);

  socket.on('disconnect', function () {
    console.log(`connection ${socket.id} closed`);
  });

  socket.on(DOWNSTREAM_MESSAGE, function (msg) {
    //console.log(`Received socket payload:  ${msg} from ${socket.id}`);
    iopubClient.publish(DOWNSTREAM_MESSAGE, msg);
  });

  iosubClient.subscribe(UPSTREAM_MESSAGE, message => {
    //console.log(`Sending socket payload: ${message} to ${socket.id}`);

    //This is sending the message to all subscribing sockets, when everything I've read so far suggests it shouldn't. Have asked on StackOverflow:

    //https://stackoverflow.com/questions/73271346/socket-io-send-notification-only-to-request-initiator
    socket.emit(UPSTREAM_MESSAGE, message);
  });
});

//Handle HTTP REST calls
app.get('/', function (req, res, next) {
  res.header('Content-Type: text/plain; charset=UTF-8');
  res.status(403).end('Access denied');
});

//pub-sub clients for http requests...
Promise.all([httppubClient.connect(), httpsubClient.connect()]).then(() => {
  httppubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  httpsubClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
});

//Redis healthCheck should be done via an external process, it is not a function of this gateway
//Upon failure of Redis health, appropriate actions including restarting gateway should be performed.
app.head('/health', function (req, res, next) {
  res.sendStatus(200);
});

app.get('/' + DOWNSTREAM_MESSAGE, function (req, res, next) {
  let payload = '{"fruit": "' + req.query.fruit + '", "month": "' + req.query.month + '"}';

  //get the data and forward it to redis directly
  httppubClient.publish(DOWNSTREAM_MESSAGE, payload);

  //Listen for response from consumer and send it to http client
  httpsubClient.subscribe(UPSTREAM_MESSAGE, message => {
    res.status(200).end(message);
  });
});

httpServer.listen(GATEWAY_PORT, function () {
  console.log(`Server ${serverName} listening at port ${GATEWAY_PORT}`);
});