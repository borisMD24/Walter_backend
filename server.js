import OmniSourceRouter from './classes/omniSourceRouter.js';
import fastify from 'fastify';
import routes from './routes.js';

const app = fastify();
const router = new OmniSourceRouter(app);

routes(router);

  router.fastify.listen({ port: 3000 }, err => {
    if (err) throw err;
    console.log('Server listening on http://localhost:3000');
  });