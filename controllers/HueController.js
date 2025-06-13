import BaseController from "./BaseController.js";
import Config from "../classes/dynamicConfig.js";
class HueController extends BaseController{
    _get(){
        console.log(this.request.params);
        
        this.success({
            yes : Config.data.jk.tt
        });
    }
}
export default HueController;