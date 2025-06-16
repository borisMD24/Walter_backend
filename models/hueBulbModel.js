import hueHelper from "../helpers/hueHelper.js";
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
    async turnOff(options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            await hueHelper.turnOff(this.hueId, options);
        } catch (error) {
            console.error(`Failed to turn off bulb ${this.name}:`, error);
            throw error;
        }
    }
    
    async turnOn(options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            await hueHelper.turnOn(this.hueId, options);
        } catch (error) {
            console.error(`Failed to turn on bulb ${this.name}:`, error);
            throw error;
        }
    }
    
    async setColor(rgb, options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            // rgb can be a Color instance, RGB array [r,g,b], or hex string
            let color;
            if (rgb instanceof Color) {
                color = rgb;
            } else {
                color = new Color(rgb);
            }
            
            await hueHelper.setColor(this.hueId, color, options);
        } catch (error) {
            console.error(`Failed to set color for bulb ${this.name}:`, error);
            throw error;
        }
    }
    
    async setBrightness(brightness, options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            // Ensure brightness is within 0-100 range
            const normalizedBrightness = Math.max(0, Math.min(100, brightness));
            await hueHelper.setBrightness(this.hueId, normalizedBrightness, options);
        } catch (error) {
            console.error(`Failed to set brightness for bulb ${this.name}:`, error);
            throw error;
        }
    }
    
    async setColorTemperature(colorTemp, options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            await hueHelper.setColorTemperature(this.hueId, colorTemp, options);
        } catch (error) {
            console.error(`Failed to set color temperature for bulb ${this.name}:`, error);
            throw error;
        }
    }
    
    // Generic command method for custom commands
    async sendCommand(commandObj, options = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            // Merge command object with options
            const fullCommand = { ...commandObj, ...options };
            await hueHelper.sendCommand(fullCommand, this.hueId);
        } catch (error) {
            console.error(`Failed to send command to bulb ${this.name}:`, error);
            throw error;
        }
    }

    // Convenience method for setting multiple properties at once
    async setState(state = {}) {
        if (!this.hueId) {
            console.error('Cannot send command: hueId is not set for this bulb');
            return;
        }
        
        try {
            const command = {};
            
            // Handle on/off
            if (typeof state.on === 'boolean') {
                command.on = state.on;
            }
            
            // Handle brightness
            if (typeof state.brightness === 'number') {
                command.brightness = Math.max(0, Math.min(100, state.brightness));
            }
            
            // Handle color
            if (state.color) {
                command.color = state.color instanceof Color ? state.color : new Color(state.color);
            }
            
            // Handle color temperature
            if (typeof state.colorTemperature === 'number') {
                command.colorTemperature = state.colorTemperature;
            }
            
            // Handle transition duration
            if (typeof state.transitionDuration === 'number') {
                command.transitionDuration = state.transitionDuration;
            }
            
            await hueHelper.sendCommand(command, this.hueId);
        } catch (error) {
            console.error(`Failed to set state for bulb ${this.name}:`, error);
            throw error;
        }
    }

    // Static methods for batch operations
    static async turnOnGroup(bulbs, options = {}) {
        const hueIds = bulbs.map(bulb => bulb.hueId).filter(id => id);
        if (hueIds.length === 0) {
            console.warn('No valid hueIds found for group operation');
            return;
        }
        
        try {
            await hueHelper.turnOnGroup(hueIds, options);
        } catch (error) {
            console.error('Failed to turn on bulb group:', error);
            throw error;
        }
    }
    
    static async turnOffGroup(bulbs, options = {}) {
        const hueIds = bulbs.map(bulb => bulb.hueId).filter(id => id);
        if (hueIds.length === 0) {
            console.warn('No valid hueIds found for group operation');
            return;
        }
        
        try {
            await hueHelper.turnOffGroup(hueIds, options);
        } catch (error) {
            console.error('Failed to turn off bulb group:', error);
            throw error;
        }
    }
    
    static async setBrightnessGroup(bulbs, brightness, options = {}) {
        const hueIds = bulbs.map(bulb => bulb.hueId).filter(id => id);
        if (hueIds.length === 0) {
            console.warn('No valid hueIds found for group operation');
            return;
        }
        
        try {
            const normalizedBrightness = Math.max(0, Math.min(100, brightness));
            await hueHelper.setBrightnessGroup(hueIds, normalizedBrightness, options);
        } catch (error) {
            console.error('Failed to set brightness for bulb group:', error);
            throw error;
        }
    }
    
    static async setColorGroup(bulbs, color, options = {}) {
        const hueIds = bulbs.map(bulb => bulb.hueId).filter(id => id);
        if (hueIds.length === 0) {
            console.warn('No valid hueIds found for group operation');
            return;
        }
        
        try {
            const colorObj = color instanceof Color ? color : new Color(color);
            await hueHelper.setColorGroup(hueIds, colorObj, options);
        } catch (error) {
            console.error('Failed to set color for bulb group:', error);
            throw error;
        }
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