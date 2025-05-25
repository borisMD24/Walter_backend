import HueHelper from "../helpers/hueHelper.js";
import BaseModel from "./baseModel.js";
import Color from "../classes/color.js";
class HueModel extends BaseModel{
    constructor(data) { 
        super(data);
    }
    turnOff(){
        this.sendCommand({
        on: {
            on: false
         }
        })
        
    }
    turnOn(){
        this.sendCommand({
            on: {
                on: true
            }
        })
    }
    setColor(rgb){
        const c = new Color(rgb);
        this.sendCommand(HueHelper.buildBody({
            color : c
        }))
        console.log("uuuuuuuuuuuuuuuuuuuu")
        console.log("uuuuuuuuuuuuuuuuuuuu")
        console.log("uuuuuuuuuuuuuuuuuuuu")
        console.log(HueHelper.buildBody({
            color : c
        }))

    }
    sendCommand(cmd){
        HueHelper.sendCommand(cmd, this.hueId);
    }
}

export default HueModel;