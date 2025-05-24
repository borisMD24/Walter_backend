import BaseModel from "./baseModel.js";
class HueModel extends BaseModel{
    constructor(data) { 
        super(data);
    }
    turnOff(){
        const myHeaders = new Headers();
        myHeaders.append("hue-application-key", "15Zc6tVIFbc0PL488-R6FyeDyHMmopjzKzbdxiTG");
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
        "on": {
            "on": false
        }
        });

        const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
        };

        fetch("https://192.168.1.34/clip/v2/resource/light/6e5c8d41-d46b-481e-8992-b9174ef059e6", requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    }
    turnOn(){
        const myHeaders = new Headers();
        myHeaders.append("hue-application-key", "15Zc6tVIFbc0PL488-R6FyeDyHMmopjzKzbdxiTG");
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
        "on": {
            "on": true
        }
        });

        const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
        };

        fetch("https://192.168.1.34/clip/v2/resource/light/6e5c8d41-d46b-481e-8992-b9174ef059e6", requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    }
}

export default HueModel;