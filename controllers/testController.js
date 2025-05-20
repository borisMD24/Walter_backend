import BaseController from "./BaseController.js";
class TestController extends BaseController{
    get(){
        this.success({
            yes : "it works"
        });
    }
}
export default TestController;