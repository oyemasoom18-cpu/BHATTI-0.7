const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'sting',
    aliases: ['stng', 'sting', 'energy', 'yellow', 'drink'],
    description: 'Send a sting image',
    credits: "SARDAR RDX",
    usage: '.sting',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/x8MH5rPs/40d90aea8633.jpg",
      "https://i.ibb.co/V0p7gC3P/4aa2ae423871.jpg",
      "https://i.ibb.co/6c49Gs5c/7394af30090d.jpg",
      "https://i.ibb.co/DPVg89ct/43c07f110c0c.jpg",
      "https://i.ibb.co/PGkj6nsh/9fe07eea7a37.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/sting_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo sting apka ly! 💛`,
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

