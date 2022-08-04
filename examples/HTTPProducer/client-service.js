const axios = require('axios');

const fruits = process.env.FRUIT ||  ["Strawberry", "Apple", "Banana", "Tomato"];
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

function publishMessage() {
  const values = getHarvestLine();
  let currentFruit = values[0];
  let currentMonth = values[1];
  
  axios.interceptors.request.use(request => {
    console.log('Sending', request.params);
    return request;
  });
  axios.interceptors.response.use(response => {
    console.log('Response:', response.data);
    return response;
  });

  axios.get('http://api-gateway:3000/harvest_line', {
    headers:{Accept: 'text/html, application/json, text/plain, */*'},
    params: {
      fruit: currentFruit,
      month: currentMonth
    }
  }).then(res => {
    //Process the response as you see fit...
    res.end;
  });
}

setInterval(publishMessage,5000);