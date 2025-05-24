import Config from "../classes/dynamicConfig.js";

const getHueToken = async () => {
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
    generateclientkey: true
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch(`http://${ip}/api`, requestOptions);
    const json = await response.json();
    if(json[0].error){
        if(json[0].error.description == "link button not pressed"){
            console.log("press button");
            
        }
    }
    if(json[0].success){
        if(json[0].success.username && json[0].success.clientkey){
            Config.write("hue.username", json[0].success.username);
            Config.write("hue.clientkey", json[0].success.clientkey);
        }
    }
  } catch (error) {
    console.error("🔥 Erreur fetch Hue token:", error);
  }
};

getHueToken();
