class HTTPRouteAbstraction {
    constructor(router, controller) {
        this.router = router;
        this.controller = controller;
        this.uri = "";
        this.base = "";
        this.allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];
        this.methodFilter = null;
        this.hasOptionalGet = false;
    }

    setUri(uri) {
        this.uri = uri;
        return this;
    }

    only(methods = []) {
        this.methodFilter = methods.map(m => m.toLowerCase());
        return this;
    }

    except(methods = []) {
        const excepted = methods.map(m => m.toLowerCase());
        this.methodFilter = this.allowedMethods.filter(m => !excepted.includes(m));
        return this;
    }

    optional() {
        this.hasOptionalGet = true;
        return this;
    }

    _shouldRegister(method) {
        if (!this.methodFilter) return true;
        return this.methodFilter.includes(method);
    }

    register(method) {
        if (!this._shouldRegister(method)) return this;

        this.router.fastify[method](`/${this.uri}`, async (req, res) => {
            const controllerInstance = new this.controller(req, res);
            await controllerInstance[method]();
        });

        return this;
    }

    get() {
    // Route sans slug (racine)
        this.router.fastify.get(`/${this.base}`, async (req, res) => {
            const controllerInstance = new this.controller(req, res);
            await controllerInstance.get();
        });

        // Route avec 1 à N segments dynamiques
        const slugCount = this.uri.split('/:').length - 1;

        // On va déclarer une route pour chaque profondeur possible
        for (let i = 1; i <= slugCount; i++) {
            const partialUri = this.uri.split('/').slice(0, i + 1).join('/');
            this.router.fastify.get(`/${partialUri}`, async (req, res) => {
                const controllerInstance = new this.controller(req, res);
                await controllerInstance.get();
            });
        }

        return this;
    }

    post()   { return this.register('post'); }
    put()    { return this.register('put'); }
    patch()  { return this.register('patch'); }
    delete() { return this.register('delete'); }

    ressources() {
        this.get();
        this.post();
        this.put();
        this.patch();
        this.delete();
        return this;
    }

    addSlugs(slugs) {
        if (!Array.isArray(slugs) || slugs.length === 0) return this;

        this.base = this.uri.replace(/\/$/, '');
        const slugPath = slugs.map(slug => `:${slug}`).join('/');
        this.uri = `${this.base}/${slugPath}`;

        return this;
    }
}

export default HTTPRouteAbstraction;