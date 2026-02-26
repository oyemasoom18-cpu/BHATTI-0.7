const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'redbull',
    aliases: ['red', 'bull', 'redbul', 'energy', 'wings'],
    description: 'Send a red bull image',
    credits: "SARDAR RDX",
    usage: '.redbull',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/3YMC5C7d/4139554525fd.jpg",
      "https://i.ibb.co/Q700ZJDg/6ffc43220d2d.jpg",
      "https://i.ibb.co/d1gBLN3/f3f708416c5f.jpg",
      "https://i.ibb.co/gFZ3Nw2R/734b145796f0.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/redbull_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo red bull apka ly! 🔴`,
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

