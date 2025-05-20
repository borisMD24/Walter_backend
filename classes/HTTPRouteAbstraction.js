class HTTPRouteAbstraction {
    constructor(router, controller) {
        this.router = router;
        this.controller = controller;
        this.uri = "";
    }

    setUri(uri) {
        this.uri = uri;
        return this; // fluency, poto
    }

    register(method) {
        this.router.fastify[method](`/${this.uri}`, async (req, res) => {
            const controllerInstance = new this.controller(req, res);
            await controllerInstance[method](); // now it's clean
        });
        return this;
    }

    get() { return this.register('get'); }
    post() { return this.register('post'); }
    put() { return this.register('put'); }
    patch() { return this.register('patch'); }
    delete() { return this.register('delete'); }

    ressources() {
        return this.get().post().put().patch().delete(); // fluide comme du miel
    }
}

export default HTTPRouteAbstraction;
