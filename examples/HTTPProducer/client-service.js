const { http } = require('http');
const axios = require('axios');
const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const GATEWAY_HOST = process.env.GATEWAY_HOST||'api-gateway';
const GATEWAY_PORT = process.env.GATEWAY_PORT||30000;
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';

function getHarvestLine() {
  //Mock simulate a record read entry
  //Pick a random fruit and send to response
  let currentFruit = Math.floor(Math.random() * fruitssize);
  let currentMonth = Math.floor(Math.random() * monthssize);
  let fruit = fruits[currentFruit];
  let month = months[currentMonth];
  return JSON.stringify({fruit, month});
}
setInterval(() => {
  let msg = getHarvestLine();
  console.log(`HTTP sending ${msg} to gateway`);
  axios.post(`http:${GATEWAY_HOST}:${GATEWAY_PORT}/${DOWNSTREAM_MESSAGE}`, {
    msg
  })
  .then((response) => {
    console.log(response);
  }, (error) => {
    console.log(error);
  });
}, 500);