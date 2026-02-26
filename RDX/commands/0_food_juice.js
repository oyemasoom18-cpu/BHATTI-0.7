const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'juice',
    aliases: ['juce', 'jus', 'juus', 'drink', 'juice'],
    description: 'Send a juice image',
    credits: "SARDAR RDX",
    usage: '.juice',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/M5x83KJT/6279c1f948fd.jpg",
      "https://i.ibb.co/GfdMxjqy/71245b5c4f2d.jpg",
      "https://i.ibb.co/nMjd55gZ/34d7e59f730f.jpg",
      "https://i.ibb.co/pBtG8YRG/5350dcdba9ee.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/juice_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo juice apka ly! 🧃`,
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

