//Node core
const cluster = require("cluster");
const http = require("http");

//External
const { Server } = require("socket.io");
const io = new Server();
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
//TODO: See if we can use redis/kafka for the socket.io sticky cluster
//const { createAdapter } = require("@socket.io/redis-adapter"); //In case we decide to use redis for session stickiness as well as pub-sub
//const kafka = require("socket.io-kafka"'); //In case we decide to use Kafka as our pub-sub system later...


//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require("os").cpus().length/2, 2); //Minimum of two workers by default
const GATEWAY_PORT = process.env.GATEWAY_PORT || 3000;

//Redis configuration
const REDIS_HOST = "redis";
const publisherRedisChannel = "publisherRedisChannel";
const subscriberRedisChannel = "subscriberRedisChannel";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const redisURL = { url: `redis://${REDIS_HOST}:${REDIS_PORT}` };

const { createClient } = require("redis");
const { Console } = require("console");
const redisClient = createClient(redisURL);

if (cluster.isMaster) {
  console.log(`Master pid: ${process.pid} is running`);
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

  httpServer.listen(GATEWAY_PORT);
  console.log("Gateway listening at port:", GATEWAY_PORT);

  for (let i = 0; i < numClusterWorkers ; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker pid: ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker pid: ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);

  // use the cluster adapter
  io.adapter(createAdapter());

  // setup connection with the primary process
  setupWorker(io);

  io.on("connection", (socket) => {
    //Create new pub/sub Redis clients per connection
    const pubClient = createClient(redisURL);
    const subClient = pubClient.duplicate();

    //Bi-directional pub-sub so publisher and subscriber are listening to each other's messages
    pubClient.subscribe(subscriberRedisChannel);
    subClient.subscribe(publisherRedisChannel);
  });

  io.on("harvest", (socket) => {
    
  });
}