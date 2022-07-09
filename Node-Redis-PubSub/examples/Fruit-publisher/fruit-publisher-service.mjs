import { Emitter } from "@socket.io/redis-emitter";
import { createClient } from "redis";

const PORT = process.env.PORT || 3000;
const PORT_REDIS = process.env.PORT || 6379;

const fruits = ["Strawberry", "Apple", "Banana"];


const redisClient = createClient({ url: "redis://redis:6379" });

redisClient.connect().then(() => {
  const emitter = new Emitter(redisClient);
  const size = fruits.length;

  setInterval(() => {
    let current = Math.floor(Math.random() * size);
  
    let fruit = fruits[current];
    //emitter.emit("time", date);
    console.log("fruit:", fruit);
  }, 500);
});