//Constants
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL || { host: REDIS_HOST, port: REDIS_PORT };
const redis = require('redis');
const downstreamRedisChannel = "downstreamRedisChannel";
const upstreamRedisChannel = "upstreamRedisChannel";

//Routes
var api = require('./routes/api');

//Node core
const cluster = require("cluster");
const http = require("http");

//External
const { Server } = require("socket.io");

const { setupMaster, setupWorker } = require("@socket.io/sticky");

//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require("os").cpus().length/2, 2); //Minimum of two workers by default
const GATEWAY_PORT = 3000;

//Redis configuration

const { createClient } = require("redis");
const redisAdapter = require("socket.io-redis");

// Security considerations
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
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  httpServer.listen(GATEWAY_PORT);

  for (let i = 0; i < numClusterWorkers; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
    console.log(`Worker ${process.pid} started`);
    const app = require("express")();
    const httpServer = http.createServer(app);
  
    var io = new Server(httpServer),
        downstreamRedisClient = redis.createClient(REDIS_URL),
        upstreamRedisClient = downstreamRedisClient.duplicate();
    
    io.adapter(redisAdapter(REDIS_URL));
    setupWorker(io);

    //TODO: Figure out why routes in external file isn't working...
    // Make io accessible to our router
    //require('./routes/api')(io);

    //Creating HTTP route in here for now - not good but Ok for POC
    app.get('/harvest_line', function(req, res) {
      res.send('Ok');
    });

    //TODO: HTTP Error Handling...

    io.on("connection", (socket) => {
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
        redisClient.quit();
      });

      downstreamRedisClient.on("message", function (channel, message) {
        console.log(channel +": " + message);
        socket.send({
          channel: channel,
          data: message
        });
      }); 
    });   
 }
