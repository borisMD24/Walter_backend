import Config from "../classes/dynamicConfig.js";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
await Config.load();

const hueGetDevices = async () => {
    const myHeaders = new Headers();
    myHeaders.append("hue-application-key", Config.data.hue.username);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
    };
    try {
        const response = await fetch("https://192.168.1.34/clip/v2/resource/device", requestOptions)
        
        const json = await response.json();
        console.log(json.data);
        
    } catch (error) {
        console.error("🔥 Erreur fetch Hue token:", error);
    }
}

hueGetDevices();