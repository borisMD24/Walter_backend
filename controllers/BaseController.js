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

  /**
   * Réponse HTTP 200 OK avec payload JSON
   * @param {any} body
   */
  success(body) {
    return this.reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(body);
  }

  /**
   * Réponse HTTP 201 Created
   * @param {any} body
   */
  created(body) {
    return this.reply
      .code(201)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(body);
  }

  /**
   * Réponse HTTP 204 No Content
   */
  noContent() {
    return this.reply.code(204).send();
  }

  /**
   * Réponse d'erreur générique
   * @param {number} statusCode
   * @param {string|object} message
   */
  error(statusCode = 500, message = 'Internal Server Error') {
    return this.reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ error: message });
  }

  /**
   * Validation simplifiée
   * @param {Function} validator - Fonction qui lance une erreur si invalide
   */
  validate(validator) {
    try {
      validator(this.request);
    } catch (err) {
      return this.error(400, err.message);
    }
  }
}

module.exports = BaseController;
