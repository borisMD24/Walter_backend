import UDPRouter from './udpRouter.js';


class OmniSourceRouter {
  constructor(fastify) {
    this.udp = new UDPRouter();
    this.fastify = fastify;
  }
}

export default OmniSourceRouter;
