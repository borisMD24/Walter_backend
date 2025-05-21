import BaseController from "./BaseController.js";
class TestController extends BaseController{
    get(){
        console.log(this.request.params);
        
        this.success({
            yes : "it works"
        });
    }
}
export default TestController;