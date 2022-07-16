//Node core
const cluster = require("cluster");
const http = require("http");

//External
const { Server } = require("socket.io");
const redisAdapter = require("socket.io-redis");
const io = new Server();
const { setupMaster, setupWorker } = require("@socket.io/sticky");

//Gateway configuration
const numClusterWorkers = process.env.NUM_GATEWAY_CLUSTER_WORKERS || Math.max(require("os").cpus().length/2, 2); //Minimum of two workers by default
const GATEWAY_PORT = 3000;

//Redis configuration
const REDIS_HOST = "redis";
const publisherRedisChannel = "publisherRedisChannel";
const subscriberRedisChannel = "subscriberRedisChannel";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const { createClient } = require("redis");

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
  
    const io = new Server(httpServer);
    io.adapter(redisAdapter({ host: REDIS_HOST, port: REDIS_PORT }));
    setupWorker(io);

    io.on("connection", (socket) => {
      console.log("connect", socket.id);
    });

    app.get("/test", (req, res) => {
      res.send("OK");
    });
}