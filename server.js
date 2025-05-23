import OmniSourceRouter from './classes/omniSourceRouter.js';
import fastify from 'fastify';
import routes from './routes.js';
import Config from './classes/dynamicConfig.js';
import ws from './classes/webSocketManager.js';

await Config.load();
const app = fastify();
const router = new OmniSourceRouter(app);
routes(router, ws);



app.ready(err => {
  if (err) throw err;
  ws.initialize(app.server);

  router.fastify.listen(
    { port: 3000, host: '0.0.0.0' },
    err => {
      if (err) throw err;
      console.log('Server listening on http://walter.local:3000');
    }
  );
});
