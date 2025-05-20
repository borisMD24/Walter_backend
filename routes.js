import HTTPRouteAbstraction from "./classes/HTTPRouteAbstraction.js";
import TestController from "./controllers/testController.js";

export default function routes(router){
    new HTTPRouteAbstraction(router, TestController)
            .setUri("test")
            .ressources();
}