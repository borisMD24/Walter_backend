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

}
export default HueHelper;
