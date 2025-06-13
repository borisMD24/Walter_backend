import dgram from 'dgram';

class UDPRouter {
  constructor() {
    this.udpServer = dgram.createSocket('udp4');

    this.udpServer.on('message', (msg, rinfo) => {
      //console.log(`Reçu UDP : ${msg} depuis ${rinfo.address}:${rinfo.port}`);
    });

    this.udpServer.bind(9999, '0.0.0.0', () => {
      console.log('Serveur UDP à l’écoute sur le port 9999');
    });
  }
}

export default UDPRouter;