class BaseController {
  constructor(request, reply) {
    this.request = request;
    this.reply = reply;
    this.beforeActions = {}; // { get: [{ name, callback }] }
    this.afterActions = {};
    this.beforeActionData = {};
    this._initHooksFromSubclass();
  }

  _initHooksFromSubclass() {
    const proto = Object.getPrototypeOf(this);

    if (typeof proto.beforeActions === 'function') {
      proto.beforeActions.call(this);
    }

    if (typeof proto.afterActions === 'function') {
      proto.afterActions.call(this);
    }
  }

  /**
   * Saves a callback to run beforeAction
   * @param {string[]} methods
   * @param {Function} callback
   * @param {string} [name]
   */
  setBeforeAction(methods, callback, name = null) {
    for (const method of methods) {
      const key = method.toLowerCase();
      this.beforeActions[key] ??= [];
      this.beforeActions[key].push({ name, callback });
    }
  }

  setAfterAction(methods, callback) {
    for (const method of methods) {
      const key = method.toLowerCase();
      this.afterActions[key] ??= [];
      this.afterActions[key].push(callback);
    }
  }

  async get() { await this.runWithHooks('get'); }
  async post() { await this.runWithHooks('post'); }
  async put() { await this.runWithHooks('put'); }
  async patch() { await this.runWithHooks('patch'); }
  async delete() { await this.runWithHooks('delete'); }

  async runWithHooks(method) {
    try {
      const befores = this.beforeActions[method] || [];
      for (const { name, callback } of befores) {
        const result = await callback(this.request, this.reply);
        if (name) this.beforeActionData[name] = result;
      }

      const handler = (this[`_${method}`] || this.defaultResponse).bind(this);
      await handler();

      const afters = this.afterActions[method] || [];
      for (const cb of afters) {
        await cb(this.request, this.reply);
      }
    } catch (err) {
      this.error(500, err.message);
    }
  }

  async _get() { this.defaultResponse(); }
  async _post() { this.defaultResponse(); }
  async _put() { this.defaultResponse(); }
  async _patch() { this.defaultResponse(); }
  async _delete() { this.defaultResponse(); }

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
