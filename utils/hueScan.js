import axios from "axios";
import Config from "../classes/dynamicConfig.js";

await Config.load();
const subnet = "192.168.1."; // à adapter si ton LAN est chelou
const needle = "hue personal wireless lighting"; // chaîne à chercher dans le HTML
const timeout = 1000; // 1s pour ne pas dormir là-dessus

async function scanIp(ip) {
  try {
    const res = await axios.get(`http://${ip}`, { timeout });
    if (res.data.includes(needle)) {
      Config.write("hue.ip", ip);
    } else {
      console.log(`Pas trouvé sur ${ip}`);
    }
  } catch (err) {
    // Silence radio = souvent pas de serveur
  }
}

(async () => {
  const promises = [];
  for (let i = 1; i < 255; i++) {
    const ip = subnet + i;
    promises.push(scanIp(ip));
  }
  await Promise.all(promises);
  console.log("🕵️‍♂️ Scan terminé.");
})();
