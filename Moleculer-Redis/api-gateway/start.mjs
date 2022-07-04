import { ServiceBroker } from "moleculer";
import ApiService from "moleculer-web";

let broker = new ServiceBroker({ logger: console });

// Load API Gateway
broker.createService(ApiService);

// Start server
broker.start();


/*
Example for setting multiple routes

broker.createService({
    mixins: [ApiService],

    settings: {
        routes: [
            {
                path: "/admin",

                authorization: true,

                whitelist: [
                    "$node.*",
                    "users.*",
                ]
            },
            {
                path: "/",

                whitelist: [
                    "posts.*",
                    "math.*",
                ]
            }
        ]
    }
});
*/