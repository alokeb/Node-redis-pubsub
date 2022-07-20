const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';
const GATEWAY_HOST = process.env.GATEWAY_HOST||'api-gateway';
const GATEWAY_PORT = process.env.GATEWAY_PORT||30000;

const {io} = require('socket.io-client');
const socket = io(`ws://${GATEWAY_HOST}:${GATEWAY_PORT}`);

function getHarvestLine() {
  return 'foo';
}

function publishMessage() {
  let msg = getHarvestLine();

  console.log(`Sending ${msg} to gateway`);
  socket.emit(DOWNSTREAM_MESSAGE, msg);
}

socket.on('connection', (socket) => {
  console.log('Socket.io Producer connected to gateway');
});

socket.on('disconnect', (socket) => {
  console.log('Socket.io Producer disconnected from gateway');
});

setInterval(publishMessage, 1000);

socket.on(UPSTREAM_MESSAGE, (msg) => {
  console.log('Received message from gateway:', msg);
});

server.listen(3000, () => {
  console.log('Socket.io Producer listening on container port:3000');
});