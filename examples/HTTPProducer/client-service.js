const { http } = require('http');

const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana", "Tomato"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const GATEWAY_HOST = process.env.GATEWAY_HOST||'api-gateway';
const GATEWAY_PORT = process.env.GATEWAY_PORT||30000;

const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
var GATEWAY_URL = "http://"+GATEWAY_HOST+":"+GATEWAY_PORT+"/"+DOWNSTREAM_MESSAGE;
const axios = require('axios')


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
  console.log(`HTTP sending ${msg} to ${GATEWAY_URL}`);  

  axios({
    method: 'POST',
    url: GATEWAY_URL, 
    data: JSON.stringify(msg), 
    headers:{'Content-Type': 'application/json; charset=utf-8'}
}) 
  .then((res) => {
    console.log(`statusCode: ${res.status}`)
    console.log(res)
  })
  .catch((error) => {
    console.error(error)
  })
}, 5000);