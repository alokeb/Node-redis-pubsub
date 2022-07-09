import { Emitter } from "@socket.io/redis-emitter";
import { createClient } from "redis";

const PORT = process.env.PORT || 3000;
const PORT_REDIS = process.env.PORT || 6379;

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


const redisClient = createClient({ url: "redis://redis:6379" });

redisClient.connect().then(() => {
  const emitter = new Emitter(redisClient);
  const size = months.length;

  setInterval(() => {
    let current = Math.floor(Math.random() * size);
  
    let month = months[current];
    //emitter.emit("time", date);
    console.log("month:", month);
  }, 500);
});