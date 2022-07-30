
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';

//Node core
const cluster = require("cluster");
const {createServer} = require("http");

//Setup express app
const express = require('express');
const app = express();
// for mounting static files to express server
app.use(express.static(__dirname+'public/'));
//Send a custom error response for unhandled routes
app.get('*', function(req, res){
  res.sendFile(__dirname+'/public/error.html');
});

const httpServer = createServer(app);

//Setup Socket.io with sticky sessions
const { Server } = require("socket.io");
const io = new Server(httpServer);
const { setupMaster, setupWorker } = require("@socket.io/sticky"); //https://socket.io/docs/v4/using-multiple-nodes

//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require("os").cpus().length, 2); //Minimum of two workers by default
const GATEWAY_PORT = 3000;

//Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL||{url: `redis://${REDIS_HOST}:${REDIS_PORT}`};
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

if (cluster.isMaster) {
  //console.log(`Master ${process.pid} is running`);

  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  
  httpServer.listen(GATEWAY_PORT, function (err) {
    if(err){
        console.log("error while starting server at container port:" + GATEWAY_PORT);
    }
    else{
        console.log("api-gateway has been started at container port " + GATEWAY_PORT + " with " + numClusterWorkers + " workers.");
    }
  });

  //Setup worker threads for the master in Socket.io cluster
  for (let i = 0; i < numClusterWorkers; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, respawning...`);
    cluster.fork();
  });
} else {
    //Setup Redis pub sub connections
    const downstreamRedisClient = redis.createClient(REDIS_URL),
          upstreamRedisClient = downstreamRedisClient.duplicate();
    Promise.all([downstreamRedisClient.connect(), upstreamRedisClient.connect()]).then(() => {
      io.adapter(createAdapter(downstreamRedisClient, upstreamRedisClient));
      //console.log('Worker pid:', process.pid, 'Connected via Redis pub sub');    
    });
    
    upstreamRedisClient.on('error', (err) =>{
      console.log(`Error occured while connecting upstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });
    downstreamRedisClient.on('error', (err) =>{
      console.log(`Error occured while connecting downstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });

    //Now setup the worker so it works with the io object with Redis connections built 
    setupWorker(io);
    //console.log(`Worker ${process.pid} ready`);

    //TODO: Figure out why routes in external file isn't working...
    // Make io accessible to our router
    //require('./routes/api')(io);

    //Create HTTP routes
    app.post(DOWNSTREAM_MESSAGE, function(req, res) {
      console.log('Received request from HTTPProducer');
      downstreamClient.publish(DOWNSTREAM_MESSAGE, req);
      //Send response back to consumer
      res.setHeader('Content-Type: text/plain; charset=UTF-8');
      res.send('ACK');
    });
    app.get("healthcheck", function(req, res){
        downstreamRedisClient.ping(function (err, result) {
          console.log('Redis said', result);
          res.send(result);
        });
    }); 
    //TODO: HTTP Error Handling as necessary...

    io.on("connect", (socket) => {
      console.log('Received socket connection');
    
      socket.on('message', function (msg) { 
        if (msg.action === "subscribe") {
          console.log("Subscribe on " + msg.channel);
          downstreamRedisClient.subscribe(msg.channel);    
        }
        if (msg.action === "unsubscribe") {
          console.log("Unsubscribe from" + msg.channel);      
          downstreamRedisClient.unsubscribe(msg.channel); 
        }
      });

      socket.on('disconnect', function () { 
        //Cleanup
        downstreamRedisClient.quit();
        upstreamRedisClient.quit();
      });

      socket.on(DOWNSTREAM_MESSAGE), function (msg) {
          downstreamRedisClient.publish(DOWNSTREAM_MESSAGE, msg);
      };
    });
  }