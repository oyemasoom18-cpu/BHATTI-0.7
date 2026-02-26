const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'macaroni',
    aliases: ['mac', 'maca', 'macaroni', 'pasta', 'noodles'],
    description: 'Send a macaroni image',
    credits: "SARDAR RDX",
    usage: '.macaroni',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/4GDNw07/bbc47d61254c.jpg",
      "https://i.ibb.co/6Jgr4yjJ/509bab38ea67.jpg",
      "https://i.ibb.co/VWpg4TVM/358e414c2016.jpg",
      "https://i.ibb.co/67PLXjmG/63beae17c265.jpg",
      "https://i.ibb.co/WWr9JwFS/e5b7f1bf0346.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/macaroni_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo macaroni apka ly! 🍝`,
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

