class BaseController {
  /**
   * Initialise le contrôleur avec la requête et la réponse Fastify.
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  constructor(request, reply) {
    this.request = request;
    this.reply = reply;
  }

  get() { this.defaultResponse(); }
  post() { this.defaultResponse(); }
  put() { this.defaultResponse(); }
  patch() { this.defaultResponse(); }
  delete() { this.defaultResponse(); }

  defaultResponse() {
    this.error(501, `The route '${this.request.method} ${this.request.url}' has not been implemented yet.`);
  }

  success(body) {
    return this.reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(body);
  }

  created(body) {
    return this.reply
      .code(201)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(body);
  }

  noContent() {
    return this.reply.code(204).send();
  }

  error(statusCode = 500, message = 'Internal Server Error') {
    return this.reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ error: message });
  }

  validate(validator) {
    try {
      validator(this.request);
    } catch (err) {
      this.error(400, err.message);
    }
  }
}
export default BaseController;