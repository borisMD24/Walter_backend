import HTTPRouteAbstraction from "./classes/HTTPRouteAbstraction.js";
import TestController from "./controllers/testController.js";
import HueController from "./controllers/HueController.js";
import BlobManager from "./classes/blobManager.js";

const http = (router) => {
    new HTTPRouteAbstraction(router, TestController)
            .setUri("test")
            .addSlugs(["nbr", "yes"])
            .optional(["get"])
            .ressources();
    new HTTPRouteAbstraction(router, HueController)
        .setUri("hue")
        .addSlugs(["id"])
        .ressources();
    router.fastify.post('/upload', async function (req, reply) {
        const data = await req.file();
        const url = await BlobManager.create(data.file, data.filename, "imgs")
        reply.send({ success: true, url });
    });
}

const wsRoute = (ws) => {
    ws.createRoom('floatingBubble', {
    messageHandler: (msg, socket) => {
        console.log(`[floatingBubble] Message from ${socket._socket.remoteAddress}: ${msg}`);
    },
    onSubscribe: (socket) => {
        socket.send('placeholder');
    },
    onUnsubscribe: (socket, isDisconnect) => {
        if (isDisconnect) {
        console.log(`client left.`);
        } else {
        socket.send('👋 bye');
        }
    }
    });
}

export default function routes(router, ws){
    http(router);
    wsRoute(ws);
}