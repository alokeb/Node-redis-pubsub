var http = require('http'); 

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const size = months.length;

var server = http.createServer(function (req, res) {   //create web server
    if (req.url == '/') { //check the URL of the current request
        //Pick a random month and send to response

        let current = Math.floor(Math.random() * size);
        let month = months[current];

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write(month);
        res.end()
    }
});    

server.listen(3000);
console.log("month server started");
