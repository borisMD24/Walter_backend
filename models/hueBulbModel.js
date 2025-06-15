import HueHelper from "../helpers/hueHelper.js";
import BaseModel from "./baseModel.js";
import Color from "../classes/color.js";

class HueBulbModel extends BaseModel {
    static get tableName() {
        return 'hue_bulbs';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string', minLength: 1, maxLength: 255 },
                hueId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            }
        };
    }
    
    // Instance methods for controlling the bulb
    turnOff() {
        this.sendCommand({
            on: {
                on: false
            }
        });
    }
    
    turnOn() {
        this.sendCommand({
            on: {
                on: true
            }
        });
    }
    
    setColor(rgb) {
        const c = new Color(rgb);
        const command = HueHelper.buildBody({
            color: c
        });
        
        console.log("Setting color command:", command);
        this.sendCommand(command);
    }
    
    sendCommand(cmd) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        HueHelper.sendCommand(cmd, this.hueId);
    }

    // Debug method to check model setup
    static debugModel() {
        const debug = this.debugKnexBinding();
        console.log('HueBulbModel debug info:', {
            ...debug,
            schema: this.jsonSchema
        });
        return debug;
    }
}

export default HueBulbModel;