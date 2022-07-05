const IO = require('socket.io')
const {
  ServiceBroker
} = require('moleculer')
const SocketIOService = require('moleculer-io')

const broker = new ServiceBroker()

broker.createService({
  name: "math",
  actions: {
    add(ctx) {
      return Number(ctx.params.a) + Number(ctx.params.b);
    }
  }
})

const ioService = broker.createService({
  name: 'io',
  mixins: [SocketIOService],
  settings: {
    port: 3000
  }
})

broker.start()