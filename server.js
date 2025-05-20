const OmniSourceRouter = require('./classes/omniSourceRouter');
const fastify = require('fastify')();
 
const router = new OmniSourceRouter(fastify);
  fastify.register(require('@fastify/postgres'), {
    connectionString: 'postgres://postgres:2429@localhost:5432/mydb'
  });


  router.fastify.get('/users', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      const { rows } = await client.query('SELECT * FROM users');
      return rows;
    } finally {
      client.release();
    }
  });  
  router.fastify.get('/test', async (request, reply) => {
    reply.code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ hello: 'world' })
  });

  router.fastify.listen({ port: 3000 }, err => {
    if (err) throw err;
    console.log('Server listening on http://localhost:3000');
  });