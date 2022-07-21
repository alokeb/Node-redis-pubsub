
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';

//Routes
var api = require('./routes/api');

//Node core
const cluster = require("cluster");
const http = require("http");

//External
const compression = require('compression');
const { Server } = require("socket.io");
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
    console.log(`Worker ${worker.process.pid} died, respawning...`);
    cluster.fork();
  });
} else {
    const app = require('express')();
    app.use(compression);
    const httpServer = http.createServer(app);
  
    var io = new Server(httpServer);
        
    const downstreamRedisClient = redis.createClient(REDIS_URL),
          upstreamRedisClient = downstreamRedisClient.duplicate();

    upstreamRedisClient.on('error', (err) =>{
      console.log(`Error occured while connecting upstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });
    downstreamRedisClient.on('error', (err) =>{
      console.log(`Error occured while connecting downstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });

    setupWorker(io);
    console.log(`Worker ${process.pid} ready`);

    //TODO: Figure out why routes in external file isn't working...
    // Make io accessible to our router
    //require('./routes/api')(io);

    //Creating HTTP route in here for now - not good but Ok for POC
    app.post(DOWNSTREAM_MESSAGE, function(req, res) {
      //Relay to Redis
      //??redisEmitter.emit(DOWNSTREAM_MESSAGE, req.);
    });
    //TODO: HTTP Error Handling...

    io.on("connection", (socket) => {
      Promise.all([downstreamRedisClient.connect(), upstreamRedisClient.connect()]).then(() => {
        io.adapter(createAdapter(downstreamRedisClient, upstreamRedisClient));
        console.log('Worker pid:', process.pid, 'Connected via Redis pub sub');    
      });
      const redisEmitter = new Emitter(downstreamRedisClient);


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
        
      };
    });
}