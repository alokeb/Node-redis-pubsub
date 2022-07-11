var http = require('http'); 

const fruits = ["Strawberry", "Apple", "Banana"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fruitssize = fruits.length;
const monthssize = months.length;
const port = process.env.PORT || 3000;

var server = http.createServer(function (req, res) {   //create web server
    if (req.url == '/') { //check the URL of the current request
        //Pick a random fruit and send to response
        
        let currentFruit = Math.floor(Math.random() * fruitssize);
        let currentMonth = Math.floor(Math.random() * monthssize);
        let fruit = fruits[currentFruit];
        let month = months[currentMonth];
        let response = [currentFruit, currentMonth]
        
        res.writeHead(200, { 'Content-Type': 'text/json' });
        res.write(JSON.stringify(response));
        res.end();

    }
});

server.listen(port);
console.log("Harvest server started at port:", port);