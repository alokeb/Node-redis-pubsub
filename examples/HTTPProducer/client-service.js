const axios = require('axios');

const fruits = process.env.FRUIT || ["Strawberry", "Apple", "Banana", "Tomato"];
const months = process.env.MONTH || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;

function getHarvestLine() {
  //Mock simulate a record read entry
  //Pick a random fruit and send to response
  let currentFruit = Math.floor(Math.random() * fruitssize);
  let currentMonth = Math.floor(Math.random() * monthssize);
  let fruit = fruits[currentFruit].toString();
  let month = months[currentMonth].toString();
  return [fruit, month];
}

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

function publishMessage() {
  const values = getHarvestLine();
  let currentFruit = values[0];
  let currentMonth = values[1];
  
  axios.get('http://api-gateway/harvest_line', {
    headers: { Accept: 'text/html, application/json, text/plain, */*' },
    params: {
      fruit: currentFruit,
      month: currentMonth
    }
  }).then(res => {
    if (!res.data.toString().includes(currentFruit) || !res.data.toString().includes(currentMonth)) {
      console.log(`ERROR: Sent ${currentFruit}, ${currentMonth}. Received ${msg}`);
    };
  });
}

//Make HTTP requests at random times
setInterval(publishMessage, 1000);