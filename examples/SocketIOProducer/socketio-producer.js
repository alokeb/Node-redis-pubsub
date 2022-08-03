const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';
const GATEWAY_URL = process.env.GATEWAY_URL||'http://api-gateway:3000';

const {io} = require('socket.io-client');
const socket = io.connect(GATEWAY_URL, {reconnect: true});

socket.on('connect', function (socket) {
  console.log('Connected to ', GATEWAY_URL);
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
  let msg = getHarvestLine();

  //console.log(`Socket.io sending ${msg} to ${GATEWAY_URL}`);
  socket.emit(DOWNSTREAM_MESSAGE, msg);
}

socket.on("disconnect", (socket) => {
  console.log('Socket.io Producer disconnected from gateway');
});

socket.on("connect", (socket) => {
  setInterval(publishMessage, 1000);
});

socket.on(UPSTREAM_MESSAGE, (msg) => {
  console.log('Received message from gateway:', msg);
});