const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';
const GATEWAY_URL = process.env.GATEWAY_URL||'http://gateway-proxy';

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

function publishMessage() {
  let payload = getHarvestLine();

  console.log(`Socket.io sending ${payload} to ${GATEWAY_URL}`);
  socket.emit(DOWNSTREAM_MESSAGE, payload);
}

socket.on("disconnect", (socket) => {
  console.log('Socket.io Producer disconnected from gateway');
});

socket.on("connect", (socket) => {
  console.log('Socket.io Producer connected to gateway');
});

socket.on(UPSTREAM_MESSAGE, (msg) => {
  console.log('Received message from gateway:', msg);
});

setInterval(publishMessage, 1000);