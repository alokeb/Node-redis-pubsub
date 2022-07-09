var http = require('http'); 

const fruits = ["Strawberry", "Apple", "Banana"];
const size = fruits.length;

var server = http.createServer(function (req, res) {   //create web server
    if (req.url == '/') { //check the URL of the current request
        //Pick a random fruit and send to response
        
        let current = Math.floor(Math.random() * size);
        let fruit = fruits[current];
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(fruit);
        res.end();

    }
});

server.listen(3000);
console.log("Fruit server started");