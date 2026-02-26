const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'rasgullah',
    aliases: ['ras', 'gullah', 'rasgula', 'rassgule', 'sweet ball'],
    description: 'Send a ras gullah image',
    credits: "SARDAR RDX",
    usage: '.rasgullah',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/dJVgHVN4/b9089737b1bc.jpg",
      "https://i.ibb.co/b5SWKh1T/cc829d8b6e28.jpg",
      "https://i.ibb.co/pBGt1t31/60c3fb1b010b.jpg",
      "https://i.ibb.co/R4gbNJs0/9f3cc7800b32.jpg",
      "https://i.ibb.co/k2XH8tGg/cab866c42522.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/rasgullah_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo ras gullah apka ly! 🤎`,
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

