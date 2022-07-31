const { http } = require('http');

const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana", "Tomato"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
var GATEWAY_URL = process.env.GATEWAY_URL||'http://api-gateway:30000/harvest_line';
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
    method: 'get',
    url: GATEWAY_URL, 
    data: JSON.stringify(msg), 
    headers:{Accept: 'text/html, application/json, text/plain, */*'}
}) 
  .then((res) => {
    console.log(`statusCode: ${res.status}`)
    console.log(res)
  })
  .catch((error) => {
    console.error(error)
  })
}, 5000);