import BaseController from "./BaseController.js";
import Config from "../classes/dynamicConfig.js";
class TestController extends BaseController{
    beforeActions(){
        this.setBeforeAction(['get'], async (req) => {
            console.log('before GET');
            this.error({
                cutoff : "works"
            })
            return { isLoggedIn: true };
        }, 'auth');
    }
    _get(){
        console.log(this.request.params);
        
        this.success({
            yes : Config.data.jk.tt,
            bad : this.beforeActionData
        });
    }
    afterActions(){
        this.setAfterAction(['get'], async (req) => {
            console.log("after Get");
        })
    }
    
}
export default TestController;