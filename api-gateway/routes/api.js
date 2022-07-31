const express = require('express');
const DOWNSTREAM_MESSAGE = process.env.DOWNSTREAM_MESSAGE||'harvest_line';
const UPSTREAM_MESSAGE = process.env.UPSTREAM_MESSAGE||'processed_havest';

/* GET home page. */
var router = function(io, downstreamRedisClient, upstreamRedisClient) {
    //Create HTTP routes
    router.get('/', function(req, res, next) {
       res.send('Access NOT Allowed');
    });

    router.post(DOWNSTREAM_MESSAGE, function(req, res) {
        console.log('Received request from HTTPProducer');
        downstreamClient.publish(DOWNSTREAM_MESSAGE, req);
        //Send response back to consumer
        res.setHeader('Content-Type: text/plain; charset=UTF-8');
        res.send('ACK');
        res.end();
      });
    
    //healthcheck call should respond with PONG
    router.get("healthcheck", function(req, res){
        downstreamRedisClient.ping(function (err, result) {
            console.log('Redis said', result);
            res.send(result);
            res.end();
        });
    });

    router.get('*'),  function(req, res) {
        res.send('Nice try');
        res.end();
    }

    module.exports = router;
};
