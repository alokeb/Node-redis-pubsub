
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
const httpPubClient = redis.createClient(REDIS_URL),
      httpSubClient = httpPubClient.duplicate(),
      ioPubClient = redis.createClient(REDIS_URL),
      ioSubClient = ioPubClient.duplicate();

//pub-sub clients io requests...
Promise.all([ioPubClient.connect(), ioSubClient.connect()]).then(() => {
  httpPubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  httpSubClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
});

//Setup Redis pub sub connections
io.adapter(createAdapter(ioPubClient, ioSubClient));

//Handle socket.io messages
io.on('connection', function (socket) {
  console.log(`connection made from ${socket.id}`);

  //Send socket session id
  socket.emit('connect_ack', socket.id);

  socket.on('disconnect', function () {
    console.log(`connection ${socket.id} closed`);
  });

  const socketRedisDownstreamChannel = `${DOWNSTREAM_MESSAGE}.${socket.id}`;
  const socketRedisUpstreamChannel = `${UPSTREAM_MESSAGE}.${DOWNSTREAM_MESSAGE}.${socket.id}`;

  socket.on(DOWNSTREAM_MESSAGE, function (msg) {
    //console.log(`Received socket payload:  ${msg} from ${socket.id}. Redis downstream channel ${socketRedisDownstreamChannel}, Redis upstream channel: ${socketRedisUpstreamChannel}`);
    
    ioPubClient.publish(socketRedisDownstreamChannel, msg);
  });
  
  ioSubClient.subscribe(socketRedisUpstreamChannel, redismessage => {
    socket.emit(UPSTREAM_MESSAGE, redismessage);
  });
});


//Handle HTTP REST calls
app.get('/', function (req, res, next) {
  res.header('Content-Type: text/plain; charset=UTF-8');
  res.status(403).end('Access denied');
});

//pub-sub clients for http requests...
Promise.all([httpPubClient.connect(), httpSubClient.connect()]).then(() => {
  httpPubClient.on('error', err => {
    console.log('Downstream Redis client connection error: ' + err);
    process.exit(-1);
  });
  httpSubClient.on('error', err => {
    console.log('Upstream Redis client connection error: ' + err);
    process.exit(-1);
  });
});

//Redis healthCheck is being performed via HAProxy providing application healthCheck hook
app.head('/health', function (req, res, next) {
  res.sendStatus(200);
});

app.get('/' + DOWNSTREAM_MESSAGE, function (req, res) {
  let payload = '{"fruit": "' + req.query.fruit + '", "month": "' + req.query.month + '"}';
  const httpRedisUpstreamChannel = `${UPSTREAM_MESSAGE}.${DOWNSTREAM_MESSAGE}.http`

  //get the data and forward it to redis directly
  httpPubClient.publish(`${DOWNSTREAM_MESSAGE}.http`, payload);

  //Listen for response from consumer and send it to http client
  httpSubClient.subscribe(httpRedisUpstreamChannel, message => {
    res.status(200).end(message);
  });
});

httpServer.listen(GATEWAY_PORT, function () {
  console.log(`Server ${serverName} listening at port ${GATEWAY_PORT}`);
});