import HTTPRouteAbstraction from "./classes/HTTPRouteAbstraction.js";
import TestController from "./controllers/testController.js";
import HueController from "./controllers/HueController.js";
import BlobManager from "./classes/blobManager.js";
import HueHelper from "./helpers/hueHelper.js";
import HueBulbModel from "./models/hueBulbModel.js";

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
    messageHandler: async (msg, socket) => {
        console.log(`[floatingBubble] Message from ${socket._socket.remoteAddress}: ${msg}`);
        // if(msg.payload.brightness){
        //     HueHelper.sendGroupedCommand(HueHelper.buildBody({
        //         transitionDuration : 10,
        //         brightness : Math.round(msg.payload.brightness/255 * 100)
        //     }), "154f48fd-ed25-407f-b548-bd99537301e2")
        // }
        if(typeof msg.payload?.brightness === 'number'){
            HueBulbModel.all().then(a=>a.forEach(e=>e.setState({brightness : msg.payload.brightness})))
            
            ws.sendFromRoom("leds",
                {
                    target: "target",
                    brightness : msg.payload.brightness
                }
            );
            console.log(msg.payload.brightness);
            
        }
    },
    onSubscribe: (socket) => {
        socket.send(JSON.stringify({
            welcome: true,
            rooms: [
                {
                    name : "kitchen",
                    id : 0,
                    img : "http://192.168.1.18:3000/public/imgs/rthumbnail.png",
                },
                {
                    name : "bathroom",
                    id : 1,
                    img : "http://192.168.1.18:3000/public/imgs/bthumbnail.png",
                },
                {
                    name : "bedroom",
                    id : 2,
                    img : "http://192.168.1.18:3000/public/imgs/brthumbnail.png",
                },
                {
                    name : "garage",
                    id : 3,
                    img : "http://192.168.1.18:3000/public/imgs/gthumbnail.png",
                },
                {
                    name : "child's rooms",
                    id : 4,
                    img : "http://192.168.1.18:3000/public/imgs/krthumbnail.png",
                }
            ],
            themes: [
                {
                    name : "golden",
                    id : 0,
                    img : "http://192.168.1.18:3000/public/imgs/thumbnail.png",
                    roomID : 0
                },
                {
                    name : "sunset",
                    id : 1,
                    img : "http://192.168.1.18:3000/public/imgs/thumbnail.png",
                    roomID : 0
                },
                {
                    name : "sunrise",
                    id : 2,
                    img : "http://192.168.1.18:3000/public/imgs/thumbnail.png",
                    roomID : 0
                },
                {
                    name : "moonlight",
                    id : 3,
                    img : "http://192.168.1.18:3000/public/imgs/thumbnail.png",
                    roomID : 0
                },
            ],
            
        }));
    },
    onUnsubscribe: (socket, isDisconnect) => {
        if (isDisconnect) {
        console.log(`client left.`);
        } else {
        socket.send('👋 bye');
        }
    }
    });
    ws.createRoom('leds', {
    messageHandler: (msg, socket) => {
        console.log(`[floatingBubble] Message from ${socket._socket.remoteAddress}: ${JSON.stringify(msg)}`);
        console.log(msg.payload.brightness);
        
        
    },
    onSubscribe: (socket) => {
        socket.send(JSON.stringify({
            welcome: true
        }));
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