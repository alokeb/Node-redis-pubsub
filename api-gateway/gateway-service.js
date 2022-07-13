//App specific constants
var constants = require('./constants');

//Node core
const cluster = require("cluster");
const http = require("http");

const numCPUs = require("os").cpus().length;

//External
const { Server } = require("socket.io");
const io = new Server();
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
//const { createAdapter, setupPrimary } = require("@socket.io/redis-adapter"); //In case we decide to use redis for session stickiness as well as pub-sub
//const kafka = require("socket.io-kafka"'); //In case we decide to use Kafka as our pub-sub system later...
const { createClient } = require("redis");

const PORT = process.env.PORT || 3000;
const PORT_REDIS = process.env.PORT || 6379;
const redisClient = createClient({ url: "redis://redis:6379" });


if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();

  // setup sticky sessions
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection",
  });

  // setup connections between the workers
  setupPrimary();

  // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
  // Node.js < 16.0.0
  //cluster.setupMaster({
  //  serialization: "advanced",
  //});
  // Node.js > 16.0.0
  cluster.setupPrimary({
   serialization: "advanced",
  });

  httpServer.listen(PORT);

  //Create 1 master + numCPUs workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);

  // use the cluster adapter
  io.adapter(createAdapter());

  // setup connection with the primary process
  setupWorker(io);

  io.on("connection", (socket) => {
    //Create new pub/sub Redis clients per connection
    const pubClient = createClient({ url: "redis://redis:6379" });
    const subClient = pubClient.duplicate();
    
  });



  io.on("harvest", (socket) => {
    //Bi-directional pub-sub so publisher and subscriber are listening to each other's messages
    pubClient.subscribe(constants.subscriberMessage);
    subClient.subscribe(constants.publisherMessage);
  });
}