import mqtt from 'mqtt';
import Config from "../classes/dynamicConfig.js";
import Color from "../classes/color.js";

class HueHelper {
  static #instance = null;
  client = null;
  isConnected = false;
  connectionPromise = null;

  // Private constructor to prevent direct construction calls
  constructor() {
    if (HueHelper.#instance) {
      return HueHelper.#instance;
    }
    HueHelper.#instance = this;
  }

  // Get the singleton instance
  static getInstance() {
    if (!HueHelper.#instance) {
      HueHelper.#instance = new HueHelper();
    }
    return HueHelper.#instance;
  }

  // Initialize MQTT connection
  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const brokerUrl = Config.data.mqtt?.broker || 'mqtt://localhost:1883';
        const topicPrefix = Config.data.mqtt?.topicPrefix || 'zigbee2mqtt';
        
        console.log('Connecting to MQTT broker:', brokerUrl);
        this.client = mqtt.connect(brokerUrl);

        this.client.on('connect', () => {
          console.log('HueHelper: Connected to MQTT broker');
          this.isConnected = true;
          
          // Subscribe to device status updates
          this.client.subscribe(`${topicPrefix}/+`, (err) => {
            if (err) {
              console.error('Failed to subscribe to device topics:', err);
            }
          });

          resolve();
        });

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client.on('close', () => {
          console.log('MQTT connection closed');
          this.isConnected = false;
        });

        this.client.on('message', (topic, message) => {
          // Handle status updates if needed
          try {
            const data = JSON.parse(message.toString());
            // You can add status update handling here
          } catch (error) {
            // Ignore parsing errors for non-JSON messages
          }
        });

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Ensure connection before sending commands
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Send command to individual light
  async sendCommand(obj, deviceName) {
    try {
      await this.ensureConnection();
      
      const body = this.buildMqttBody(obj);
      const topicPrefix = Config.data.mqtt?.topicPrefix || 'zigbee2mqtt';
      const commandTopic = `${topicPrefix}/${deviceName}/set`;

      console.log(`Sending command to ${deviceName}:`, body);
      
      return new Promise((resolve, reject) => {
        this.client.publish(commandTopic, JSON.stringify(body), (err) => {
          if (err) {
            console.error('Failed to send MQTT command:', err);
            reject(err);
          } else {
            console.log('✅ Command sent successfully');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error sending MQTT command:', error);
      throw error;
    }
  }

  // Send command to grouped lights (broadcast to multiple devices)
  async sendGroupedCommand(obj, deviceNames) {
    try {
      await this.ensureConnection();
      
      const promises = deviceNames.map(deviceName => 
        this.sendCommand(obj, deviceName)
      );
      
      return Promise.all(promises);
    } catch (error) {
      console.error('Error sending grouped MQTT command:', error);
      throw error;
    }
  }

  // Build MQTT command body (adapted from Zigbee2MQTT format)
  buildMqttBody(obj) {
    const body = {};

    // Handle on/off state
    if (typeof obj.on === "boolean") {
      body.state = obj.on ? 'ON' : 'OFF';
    }

    // Handle brightness (convert from percentage to 0-255 range)
    if (typeof obj.brightness === "number") {
      // Assuming input is 0-100 percentage, convert to 0-255
      body.brightness = Math.round((obj.brightness / 100) * 255);
    }

    // Handle color
    if (obj.color instanceof Color) {
      body.color = {
        x: obj.color.xy[0],
        y: obj.color.xy[1]
      };
    } else if (Array.isArray(obj.color) && obj.color.length === 3) {
      const c = new Color(obj.color);
      body.color = {
        x: c.xy[0],
        y: c.xy[1]
      };
    }

    // Handle color temperature (convert mirek to Zigbee2MQTT format)
    if (typeof obj.colorTemperature === "number") {
      body.color_temp = obj.colorTemperature;
    }

    // Handle transition duration (convert to seconds if provided in milliseconds)
    if (typeof obj.transitionDuration === "number") {
      body.transition = obj.transitionDuration / 1000; // Convert ms to seconds
    }

    return body;
  }

  // Convenience methods for common operations
  async turnOn(deviceName, options = {}) {
    return this.sendCommand({ on: true, ...options }, deviceName);
  }

  async turnOff(deviceName, options = {}) {
    return this.sendCommand({ on: false, ...options }, deviceName);
  }

  async setBrightness(deviceName, brightness, options = {}) {
    return this.sendCommand({ brightness, ...options }, deviceName);
  }

  async setColor(deviceName, color, options = {}) {
    return this.sendCommand({ color, ...options }, deviceName);
  }

  async setColorTemperature(deviceName, colorTemperature, options = {}) {
    return this.sendCommand({ colorTemperature, ...options }, deviceName);
  }

  // Group convenience methods
  async turnOnGroup(deviceNames, options = {}) {
    return this.sendGroupedCommand({ on: true, ...options }, deviceNames);
  }

  async turnOffGroup(deviceNames, options = {}) {
    return this.sendGroupedCommand({ on: false, ...options }, deviceNames);
  }

  async setBrightnessGroup(deviceNames, brightness, options = {}) {
    return this.sendGroupedCommand({ brightness, ...options }, deviceNames);
  }

  async setColorGroup(deviceNames, color, options = {}) {
    return this.sendGroupedCommand({ color, ...options }, deviceNames);
  }

  // Device discovery and management
  async getDevices() {
    try {
      await this.ensureConnection();
      
      const topicPrefix = Config.data.mqtt?.topicPrefix || 'zigbee2mqtt';
      const devicesTopic = `${topicPrefix}/bridge/request/devices`;
      
      return new Promise((resolve) => {
        // Set up a temporary listener for the device list response
        const responseHandler = (topic, message) => {
          if (topic === `${topicPrefix}/bridge/devices`) {
            try {
              const devices = JSON.parse(message.toString());
              this.client.off('message', responseHandler);
              resolve(devices);
            } catch (error) {
              console.error('Failed to parse device list:', error);
              resolve([]);
            }
          }
        };

        this.client.on('message', responseHandler);
        
        // Request device list
        this.client.publish(devicesTopic, '', (err) => {
          if (err) {
            console.error('Failed to request device list:', err);
            resolve([]);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          this.client.off('message', responseHandler);
          resolve([]);
        }, 5000);
      });
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  // Enable pairing mode
  async enablePairing(duration = 60) {
    try {
      await this.ensureConnection();
      
      const topicPrefix = Config.data.mqtt?.topicPrefix || 'zigbee2mqtt';
      const pairingTopic = `${topicPrefix}/bridge/request/permit_join`;
      const command = { value: true, time: duration };

      return new Promise((resolve, reject) => {
        this.client.publish(pairingTopic, JSON.stringify(command), (err) => {
          if (err) {
            console.error('Failed to enable pairing mode:', err);
            reject(err);
          } else {
            console.log(`✅ Pairing mode enabled for ${duration} seconds`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error enabling pairing mode:', error);
      throw error;
    }
  }

  // Disconnect from MQTT broker
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('HueHelper: Disconnected from MQTT broker');
    }
  }

  // Legacy method names for backward compatibility
  async sendCommand_legacy(body, id) {
    console.warn('sendCommand with ID is deprecated. Use sendCommand(obj, deviceName) instead.');
    // Try to map the old format to new format
    return this.sendCommand(body, id);
  }

  buildBody(obj) {
    console.warn('buildBody is deprecated. Use buildMqttBody instead.');
    return this.buildMqttBody(obj);
  }
}

export default HueHelper.getInstance();