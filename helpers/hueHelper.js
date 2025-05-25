import Config from "../classes/dynamicConfig.js";
import Color from "../classes/color.js";
class HueHelper {
  static builHeaders() {
    const headers = new Headers();
    headers.append("hue-application-key", Config.data.hue.username);
    headers.append("Content-Type", "application/json");
    return headers;
  }
  static sendCommand(body, id) {
    const requestOptions = {
      method: "PUT",
      headers: this.builHeaders(),
      body: JSON.stringify(body),
      redirect: "follow",
    };

    fetch(
      "https://" + Config.data.hue.ip + "/clip/v2/resource/light/" + id,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
  }
  static buildBody(obj) {
    const body = {};
    if (obj.color instanceof Color) {
      body.color = {
        xy: {
          x: obj.color.xy[0],
          y: obj.color.xy[1],
        },
      };
    } else if (Array.isArray(obj.color) && obj.color.length === 3) {
      const c = new Color(obj.color);
      body.color = {
        xy: {
          x: c.xy[0],
          y: c.xy[1],
        },
      };
    }
    if (typeof obj.transitionDuration === "number") {
      body.dynamics = {
        duration: obj.transitionDuration,
      };
    }
    if (typeof obj.on === "boolean") {
      body.on = { on: obj.on };
    }
    if (typeof obj.brightness === "number") {
      body.dimming = {
        brightness: obj.brightness,
      };
    }
    if (typeof obj.colorTemperature === "number") {
      body.color_temperature = {
        mirek: obj.colorTemperature,
      };
    }

    return body;
  }
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
        "https://192.168.1.34/clip/v2/resource/device",
        requestOptions
      );

      const json = await response.json();
      console.log(json.data);
    } catch (error) {
      console.error("🔥 Erreur fetch Hue token:", error);
    }
  }
  static async getHueToken() {
    // On attend la config chargée
    await Config.load();

    // On récupère la config dans l'objet chargé
    const ip = Config.data.hue?.ip;
    if (!ip) {
      console.error("❌ IP Hue non configurée dans le fichier config.");
      return;
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
          console.log("press button");
        }
      }
      if (json[0].success) {
        if (json[0].success.username && json[0].success.clientkey) {
          await Config.write("hue.username", json[0].success.username);
          await Config.write("hue.clientkey", json[0].success.clientkey);
        }
      }
    } catch (error) {
      console.error("🔥 Erreur fetch Hue token:", error);
    }
  }
}
export default HueHelper;
