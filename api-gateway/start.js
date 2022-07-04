let { ServiceBroker } = require("moleculer");
let ApiService = require("moleculer-web");

let broker = new ServiceBroker({ logger: console });

// Load API Gateway
broker.createService(ApiService);

// Start server
broker.start();