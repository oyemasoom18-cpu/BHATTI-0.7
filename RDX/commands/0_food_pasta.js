const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'pasta',
    aliases: ['past', 'pasta', 'spaghetti', 'pasts', 'italian'],
    description: 'Send a pasta image',
    credits: "SARDAR RDX",
    usage: '.pasta',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/3mPrGjLX/a3a35c560d21.jpg",
      "https://i.ibb.co/svpPMcNF/529f231b21c4.jpg",
      "https://i.ibb.co/1pYm415/f66077d1233d.jpg",
      "https://i.ibb.co/rGxTLkKm/c249e78fbac4.jpg",
      "https://i.ibb.co/yndL45Nz/af49533a363c.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/pasta_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo pasta apka ly! 🍝`,
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

