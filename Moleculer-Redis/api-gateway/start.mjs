import { ServiceBroker } from "moleculer";
import ApiService from "moleculer-web";

let broker = new ServiceBroker({ logger: console });

// Create a service
broker.createService({
    name: "test",
    actions: {
        hello() {
            return "Hello API Gateway!"
        }
    }
});

// Load API Gateway
broker.createService(ApiService);

// Start server
broker.start();