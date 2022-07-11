import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const PORT = process.env.PORT || 3000;
const PORT_REDIS = process.env.PORT || 6379;
const redisClient = createClient({ url: "redis://redis:6379" });

const io = new Server();

const pubClient = createClient({ url: "redis://redis:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
io.listen(PORT);
console.log("Gateway service listening on port", PORT);