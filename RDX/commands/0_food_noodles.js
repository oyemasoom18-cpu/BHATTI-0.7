const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'noodles',
    aliases: ['noodle', 'nodles', 'nood', 'noddles', 'chow'],
    description: 'Send a noodles image',
    credits: "SARDAR RDX",
    usage: '.noodles',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/tTf4PF1h/8e7bf0697f4e.jpg",
      "https://i.ibb.co/DgCmqL4J/e0de79d575ff.jpg",
      "https://i.ibb.co/spKkfD5Q/f7303a22f824.jpg",
      "https://i.ibb.co/7xM2YNdh/c89536807a92.jpg",
      "https://i.ibb.co/84xT96pW/576a5659629a.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/noodles_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo noodles apka ly! 🍜`,
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

