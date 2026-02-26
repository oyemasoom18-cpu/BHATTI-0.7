const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'gajar',
    aliases: ['gajarkahalwa', 'halwa', 'halwa gajar', 'carrot', 'gajrela'],
    description: 'Send a gajar ka halwa image',
    credits: "SARDAR RDX",
    usage: '.gajar',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/v6h1YM7T/ae3f779ec4f5.jpg",
      "https://i.ibb.co/d45HQY2L/9e84433f0914.jpg",
      "https://i.ibb.co/p6d4cxh7/50ee6c736197.jpg",
      "https://i.ibb.co/2YpfC094/815483cb4031.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/gajar_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo gajar ka halwa apka ly! 🧡`,
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

