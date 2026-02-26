const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'dahibhaly',
    aliases: ['dahi', 'bhaly', 'dahibhali', 'yogurt', 'daihibaly'],
    description: 'Send a dahi bhaly image',
    credits: "SARDAR RDX",
    usage: '.dahibhaly',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/NdzhhYTD/fa1d7e1e7642.jpg",
      "https://i.ibb.co/mr9vTSR3/a5fbba67bdab.jpg",
      "https://i.ibb.co/KzbZrDMh/0401565279d5.jpg",
      "https://i.ibb.co/wrPfFSkM/aa94c365de29.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/dahibhaly_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo dahi bhaly apka ly! 🥄`,
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

