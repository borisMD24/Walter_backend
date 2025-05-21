import BaseController from "./BaseController.js";
class TestController extends BaseController{
    get(){
        console.log(this.request.params);
        
        this.success({
            yes : Config.data.jk.tt
        });
    }
}
export default TestController;