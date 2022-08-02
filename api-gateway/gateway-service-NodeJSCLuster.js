
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';

//Node core
const cluster = require("cluster");
const {createServer} = require("http");

//Setup express app
const express = require('express');
const app = express();
const httpServer = createServer(app);

//Setup Socket.io with sticky sessions
const { Server } = require("socket.io");
const io = new Server(httpServer);
const { setupMaster, setupWorker } = require("@socket.io/sticky"); //https://socket.io/docs/v4/using-multiple-nodes

//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require("os").cpus().length, 2); //Minimum of two workers by default
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

//Create socket.io cluster with 1 master controlling the worker pool
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
    const pubClient = redis.createClient(REDIS_URL),
          subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      pubClient.on('error', err => {
          console.log('Downstream Redis client connection error: ' + err);
      });
      subClient.on('error', err => {
        console.log('Upstream Redis client connection error: ' + err);
      });
      io.adapter(createAdapter(pubClient, subClient));
    });
    
    subClient.on('error', (err) =>{
      console.log(`Error occured while connecting upstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });
    pubClient.on('error', (err) =>{
      console.log(`Error occured while connecting downstream to redis server. Is it available at ${REDIS_URL}?`, err);
      process.exit(-1);
    });

    //Now setup the worker so it works with the io object with Redis connections built 
    setupWorker(io);
    //console.log(`Worker ${process.pid} ready`);

    //Handle HTTP REST calls
    app.get('/', function(req, res) {
      res.header('Content-Type: text/plain; charset=UTF-8');
      res.status(403).end('Access denied');
     });

    app.get('/'+DOWNSTREAM_MESSAGE, function(req, res) {
        

        let payload = '{fruit: '+ req.query.fruit + ', month: ' + req.query.month + '}';
        //Send acknowledge response back to http producer
        res.header('Content-Type: text/plain; charset=UTF-8');
        res.status(200).end('ACK');

        //get the data and forward it to redis in the httproom so we know this came from REST call
        console.log(`Publishing ${payload} to Redis`)
        pubClient.publish(DOWNSTREAM_MESSAGE, payload);
    });
    
    app.get('/healthcheck', function(req, res) {
      res.header('Content-type: application/json; charset=UTF-8');
      const data = {
        uptime: process.uptime(),
        message: 'Ok',
        date: new Date()
      }
      
      res.status(200).end(data);
    });
    
    //Redis healthCheck should be done via an external process, it is not a function of this gateway
    //Upon failure of Redis health, appropriate actions including restarting gateway should be performed.
   
    //Handle socket.io messages
    io.on("connection", (socket) => {
      console.log('Received socket.io connection');

      //The redis adapter will publish directly
      // socket.on(DOWNSTREAM_MESSAGE), function (msg) {
      //     console.log(`Received ${msg} from socket.io client`);
      // };
      
      // socket.on(UPSTREAM_MESSAGE), function (msg) {
      //     console.log(`Received ${msg} from socket.io client`);
      // };


    });
  }