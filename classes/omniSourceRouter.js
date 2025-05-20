const dgram = require('dgram');
const UDPRouter = require('./udpRouter');

class OmniSourceRouter {
  constructor(fastify) {
    this.udp = new UDPRouter();
    this.fastify = fastify;
  }
}

module.exports = OmniSourceRouter;
