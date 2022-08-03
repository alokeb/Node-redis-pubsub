'use strict';
const stickyCluster = require('sticky-cluster');

function perform(callback) {
    var async = require('async');
    async.waterfall(
        [
            function (callback) {
                async.parallel(
                  [
                    // fake db 1
                    function (callback) { callback.listen(3000); }
                  ],
                  callback
                );
              },

            // configure the workers
            function setup(services, callback) {
                const http = require('http');
                const app = require('express')();

                // all express-related stuff goes here, e.g.
                app.use(function (req, res) { res.end('Handled by PID = ' + process.pid); });
                
                app.get('/', function (req, res) {
                    res.header('Content-Type: text/plain; charset=UTF-8');
                    res.status(403).end('Access denied');
                });

                app.get('/healthcheck', function(req, res) {
                    res.header('Content-type: application/json; charset=UTF-8');
                    const data = {
                      uptime: process.uptime(),
                      message: 'Ok',
                      date: new Date()
                    }
                    
                    res.status(200).end(data);
                });

                app.get('/harvest_line', function (req, res) {
                    let payload = '{"fruit": "' + req.query.fruit + '", "month": "' + req.query.month + '"}';

                    //get the data and forward it to redis in the httproom so we know this came from REST call
                    console.log(`Publishing ${payload} to Redis`);
                    pubClient.publish(DOWNSTREAM_MESSAGE, payload);

                    //Listen for response from consumer and send it to http client
                    subClient.subscribe(UPSTREAM_MESSAGE, message => {
                        console.log('Got response from consumer, sending to http client');
                        res.status(200).end(message);

                    });
                });

                // all socket.io stuff goes here
                var io = require('socket.io')(server);
                const redis = require('redis');
                const {createAdapter} = require("@socket.io/redis-adapter");
                const REDIS_URL = process.env.REDIS_URL||{url: 'redis://redis:6379'};

                var server = http.createServer(app);
                const pubClient = redis.createClient(REDIS_URL),
                    subClient = pubClient.duplicate();

                Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
                    pubClient.on('error', err => {
                        console.log('Downstream Redis client connection error: ' + err);
                    });
                    subClient.on('error', err => {
                        console.log('Upstream Redis client connection error: ' + err);
                    });
                    io.adapter(createAdapter(pubClient, subClient));
                });

                io.adapter(createAdapter(pubClient, subClient));

                // don't do server.listen(...), just pass the server instance to the final async's callback
                callback(null, server);
            },

        ],
        function (err, server) {
            // fail on error
            if (err) { console.log(err); process.exit(1); }

            // pass server instance to sticky-cluster
            else {
                callback(server);
            }
        }
    );
}

stickyCluster(perform, {
    concurrency: parseInt(require('os').cpus().length, 10),
    port: 3000,
    debug: true,
    env: function (index) { return { stickycluster_worker_index: index }; }
});