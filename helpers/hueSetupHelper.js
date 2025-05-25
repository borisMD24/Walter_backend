import Config from "../classes/dynamicConfig.js";
import axios from "axios";
import HueModel from "../models/hueModel.js";
class HueSetupHelper{
      static async getDevices() {
  const myHeaders = new Headers();
  myHeaders.append("hue-application-key", Config.data.hue.username);
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };
  
  try {
    const response = await fetch(
      "https://"+Config.data.hue.ip+"/clip/v2/resource/device",
      requestOptions
    );

    const json = await response.json();
    
    // Filter out the bridge, keep only bulbs/lights
    const bulbs = json.data.filter(device => 
      device.product_data.product_archetype !== 'bridge_v2'
    );
    await bulbs.map(async (bulb)=>{
      console.log(bulb.services.filter(s => s.rtype == "light"));
      const hueId = bulb.services.filter(s => s.rtype == "light")[0]["rid"];
      console.log(hueId);
      console.log(bulb.metadata.name);
      
      const checkHue = await HueModel.where(
        {
          hueId : hueId
        }
      )
      console.log(checkHue);
      
      if(checkHue == 0){
        await HueModel.create({
          hueId,
          name: bulb.metadata.name,
          up: true,
          model: "bulb"
        }).catch((e)=> console.log(e))
      }
    })
    
  } catch (error) {
    console.error("🔥 Erreur fetch Hue token:", error);
  }
}
  static async getHueToken() {

    // On récupère la config dans l'objet chargé
    const ip = Config.data.hue?.ip;
    if (!ip) {
      return {
        error: "hueIp is'nt set",
      };
    }

    const raw = JSON.stringify({
      devicetype: "walter#walter",
      generateclientkey: true,
    });

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(`http://${ip}/api`, requestOptions);
      const json = await response.json();
      if (json[0].error) {
        if (json[0].error.description == "link button not pressed") {
          return {
            error: "the button is'nt pressed",
          };
        }
      }
      if (json[0].success) {
        if (json[0].success.username && json[0].success.clientkey) {
          await Config.write("hue.username", json[0].success.username);
          await Config.write("hue.clientkey", json[0].success.clientkey);
          return true;
        }
      }
    } catch (error) {
      return {
        error
      };
    }
  }
  static async findBridge() {
    const foundIps = [];
    const promises = [];

    for (let i = 1; i < 255; i++) {
      const ip = "192.168.1." + i;
      promises.push(
        axios
          .get(`http://${ip}`, { timeout: 1000})
          .then((res) => {
            if (res.data.includes("hue personal wireless lighting")) foundIps.push(ip);
          })
          .catch(() => {
          })
      );
    }

    await Promise.all(promises);
    return foundIps;
  }
  static async setup(){
    const ips = await this.findBridge();
    if(ips.length == 0){
      return {error : "bridge not found"}
    }
    await Config.write("hue.ip", ips[0]);
    const hueTokenFetched = this.getHueToken();
    if(hueTokenFetched != true){
      return hueTokenFetched;
    }
  }
}
export default HueSetupHelper;