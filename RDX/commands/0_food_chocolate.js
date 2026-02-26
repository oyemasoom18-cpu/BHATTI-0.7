const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'chocolate',
    aliases: ['choco', 'chokolate', 'choccy', 'cocoa', 'choccy'],
    description: 'Send a chocolate image',
    credits: "SARDAR RDX",
    usage: '.chocolate',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
       "https://i.ibb.co/KcVJtqBC/719e0aa8285f.jpg",
      "https://i.ibb.co/1JBJwSn2/fc5210230941.jpg",
      "https://i.ibb.co/C5YJ5Vp7/b5aaa66ffae0.jpg",
      "https://i.ibb.co/rGJ4snZm/b4da882bdd6a.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/chocolate_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo chocolate apka ly! 🍫`,
            attachment: fs.createReadStream(imgPath)
          }, event.threadID, () => {
            try { fs.unlinkSync(imgPath); } catch (e) {}
          });
        })
        .on("error", () => {
          send.reply('❌ Image نہیں بھیج سکا');
        });
    } catch (error) {
      return send.reply('❌ خرابی: ' + error.message);
    }
  }
};

