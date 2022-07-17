var express = require('express');
var router = express.Router();

/* GET home page. */
var returnRouter = function(io) {
    router.get('/', function(req, res, next) {
       res.send('OK');
    });

    router.post('/message', function(req, res) {
        console.log("Post request hit.");
        console.log(appjs);
        io.sockets.emit("display text", req);
    });

    return router;
}

module.exports = returnRouter;