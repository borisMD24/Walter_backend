// import Config from "../classes/dynamicConfig.js";
// import axios from "axios";
// import HueModel from "../models/hueModel.js";

// class HueSetupHelper {
//   static async getDevices() {
//     const headers = {
//       "hue-application-key": Config.data.hue.username,
//       "Content-Type": "application/json",
//     };

//     const requestOptions = {
//       method: "GET",
//       headers,
//       redirect: "follow",
//     };

//     try {
//       const response = await fetch(
//         `https://${Config.data.hue.ip}/clip/v2/resource/device`,
//         requestOptions
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const json = await response.json();

//       // Filter out the bridge, keep only bulbs/lights
//       const bulbs = json.data.filter(
//         (device) => device.product_data.product_archetype !== "bridge_v2"
//       );

//       // Use Promise.all instead of map with async
//       const bulbPromises = bulbs.map(async (bulb) => {
//         const lightServices = bulb.services.filter((s) => s.rtype === "light");
        
//         if (lightServices.length === 0) {
//           console.warn(`No light service found for bulb: ${bulb.metadata.name}`);
//           return;
//         }

//         const hueId = lightServices[0].rid;
//         console.log(`Processing bulb - ID: ${hueId}, Name: ${bulb.metadata.name}`);

//         try {
//           const existingHue = await HueModel.where({ hueId });

//           // Check if no existing records found (empty array or length 0)
//           if (!existingHue || existingHue.length === 0) {
//             await HueModel.create({
//               hueId,
//               name: bulb.metadata.name,
//               up: true,
//               model: "bulb",
//             });
//             console.log(`Created new Hue device: ${bulb.metadata.name}`);
//           } else {
//             console.log(`Hue device already exists: ${bulb.metadata.name}`);
//           }
//         } catch (error) {
//           console.error(`Error processing bulb ${bulb.metadata.name}:`, error);
//         }
//       });

//       await Promise.all(bulbPromises);
//       console.log("Device synchronization completed");
      
//     } catch (error) {
//       console.error("🔥 Error fetching Hue devices:", error);
//       throw error;
//     }
//   }

//   static async getHueToken() {
//     const ip = Config.data.hue?.ip;
//     if (!ip) {
//       return {
//         error: "Hue IP is not set",
//       };
//     }

//     const requestBody = {
//       devicetype: "walter#walter",
//       generateclientkey: true,
//     };

//     const requestOptions = {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),
//       redirect: "follow",
//     };

//     try {
//       const response = await fetch(`https://${ip}/api`, requestOptions);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const json = await response.json();

//       // Handle error response
//       if (json[0]?.error) {
//         const errorDescription = json[0].error.description;
//         if (errorDescription === "link button not pressed") {
//           return {
//             error: "The link button on the bridge is not pressed",
//           };
//         }
//         return {
//           error: errorDescription,
//         };
//       }

//       // Handle success response
//       if (json[0]?.success) {
//         const { username, clientkey } = json[0].success;
//         if (username && clientkey) {
//           await Config.write("hue.username", username);
//           await Config.write("hue.clientkey", clientkey);
//           return { success: true };
//         }
//       }

//       return {
//         error: "Unexpected response format from Hue bridge",
//       };
      
//     } catch (error) {
//       console.error("Error getting Hue token:", error);
//       return {
//         error: error.message || "Failed to get Hue token",
//       };
//     }
//   }

//   static async findBridge() {
//     const foundIps = [];
//     const promises = [];
//     const baseIp = "192.168.1.";

//     for (let i = 1; i < 255; i++) {
//       const ip = baseIp + i;
//       const promise = axios
//         .get(`http://${ip}`, { 
//           timeout: 1000,
//           validateStatus: () => true // Accept any status code
//         })
//         .then((response) => {
//           if (response.data && 
//               typeof response.data === 'string' && 
//               response.data.includes("hue personal wireless lighting")) {
//             foundIps.push(ip);
//           }
//         })
//         .catch(() => {
//           // Silently ignore network errors (expected for most IPs)
//         });

//       promises.push(promise);
//     }

//     await Promise.all(promises);
//     return foundIps;
//   }

//   static async setup() {
//     try {
//       console.log("Starting Hue bridge setup...");
      
//       // Find bridge
//       const ips = await this.findBridge();
//       if (ips.length === 0) {
//         return { 
//           error: "Hue bridge not found on network" 
//         };
//       }

//       console.log(`Found Hue bridge at: ${ips[0]}`);
//       await Config.write("hue.ip", ips[0]);

//       // Get token
//       const tokenResult = await this.getHueToken();
//       if (!tokenResult.success) {
//         return tokenResult;
//       }

//       console.log("Hue token obtained successfully");

//       // Get devices
//       await this.getDevices();

//       return {
//         success: "Hue bridge has been setup successfully",
//       };
      
//     } catch (error) {
//       console.error("Error during Hue setup:", error);
//       return {
//         error: "Setup failed: " + error.message,
//       };
//     }
//   }
// }

// export default HueSetupHelper;