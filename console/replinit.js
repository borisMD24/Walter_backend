import setup from "./consoleInit.js";

// Self-executing async function to allow top-level await
(async () => {
  try {
    await setup();

console.log("✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨");
console.log("✨ _    _       _ _             ______     _                 ✨");
console.log("✨| |  | |     | | |            |  _  \\   | |                ✨");
console.log("✨| |  | | __ _| | |_ ___ _ __  | | | |___| |__  _   _  __ _ ✨");
console.log("✨| |/\\| |/ _` | | __/ _ \\ '__| | | | / _ \\ '_ \\| | | |/ _` |✨");
console.log("✨\\  /\\  / (_| | | ||  __/ |    | |/ /  __/ |_) | |_| | (_| |✨");
console.log("✨ \\/  \\/ \\__,_|_|\\__\\___|_|    |___/ \\___|_.__/ \\__,_|\\__, |✨");
console.log("✨                                                      __/ |✨");
console.log("✨                                                     |___/ ✨");
console.log("✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨");

  } catch (error) {
    console.error("Setup error:", error);
  }
})();

// Export something to make this a valid module
export default {};