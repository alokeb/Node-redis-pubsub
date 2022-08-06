const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';
const GATEWAY_URL = process.env.GATEWAY_URL||'http://api-gateway';
const randomUUID = require('crypto').randomUUID();

const {io} = require('socket.io-client');
const socket = io.connect(GATEWAY_URL, {
  reconnect: true,
  withCredentials: true
});

function getHarvestLine() {
  //Mock simulate a record read entry
  //Pick a random fruit and send to response
  let currentFruit = Math.floor(Math.random() * fruitssize);
  let currentMonth = Math.floor(Math.random() * monthssize);
  let fruit = fruits[currentFruit];
  let month = months[currentMonth];
  return JSON.stringify({fruit, month});
}
var payload = '';
function publishMessage() {
  payload = getHarvestLine();
  console.log(`Sending ${payload}`);
  
  socket.emit('join', randomUUID);
  socket.emit(DOWNSTREAM_MESSAGE, payload);
}

socket.on("disconnect", (socket) => {
  console.log(`Socket disconnected from gateway`);
});

socket.on("connect", (socket) => {
  console.log(`Socket connected to gateway`);
});

socket.on(UPSTREAM_MESSAGE, (msg) => {
  console.log(`Received ${msg}`);
});

setInterval(publishMessage, Math.floor(Math.random()*10000));