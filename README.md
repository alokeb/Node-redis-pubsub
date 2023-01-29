# Node-redis-pubsub

An example API gateway as a PoC for a project that had the following requirements:

* An API gateway that can handle 5k persistent (SocketIO) connections
* Reliable message delivery
* Bi-directional message delivery where the response message is guaranteed to go to the recipient that sent the request message and to no other recipients
* Can handle both WebSocket and HTTP RESTful payloads

Given this, and also the fact that I was learning almost everything including Node, Docker etc. pretty much everything I used in the project, I came up with the solution you see in front of you. I was tired of seeing chat examples of Node pub-sub so I came up with a simple Farm Harvest use case.

Redis stood out for this particular use case for several reasons:

* RabbitMQ/other message queues would be fast, but as far as I read, there was no way to persist or reconstruct any messages in case of a downtime while clients would still be sending messages. Redis allows that making the solution much more reliable
* Kafka would also work and would provide even more reliability due to its journal based system, but it would come at the cost of speed - can be up to 10x slower in worst case scenarios.

I hope the parts of the project that I was allowed to publish publicly can help out others trying to learn Node and Redis pub-sub
