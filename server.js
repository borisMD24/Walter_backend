process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';

import OmniSourceRouter from './classes/omniSourceRouter.js';
import routes from './routes.js';
import Config from './classes/dynamicConfig.js';
import ws from './classes/webSocketManager.js';
import HueHelper from './helpers/hueHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    await Config.load();
    await HueHelper.instance.connect();
    const app = fastify();

    app.register(fastifyStatic, {
      root: path.join(__dirname, 'public'),
      prefix: '/public/',
      decorateReply: false
    });
    app.register(fastifyMultipart);
    const router = new OmniSourceRouter(app);
    routes(router, ws);

    await app.ready();

    ws.initialize(app.server);

    await app.listen({ port: 3000, host: '0.0.0.0' });

    console.log('✨ Server listening on http://walter.local:3000 ✨');
    console.log('🗂️  Static assets served from /public/');
  } catch (err) {
    console.error('💥 Failed to start the server:', err);
    process.exit(1);
  }
}

startServer();
