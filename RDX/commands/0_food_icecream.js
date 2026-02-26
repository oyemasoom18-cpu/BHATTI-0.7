const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'icecream',
    aliases: ['ice', 'cream', 'icecrem', 'ice cream', 'frozen'],
    description: 'Send a ice cream image',
    credits: "SARDAR RDX",
    usage: '.icecream',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/35n6QnJS/012361b81d6f.jpg",
      "https://i.ibb.co/BHgST4Tk/29f1d99187db.jpg",
      "https://i.ibb.co/PGVvmvKN/5ab35a4a2f3c.jpg",
      "https://i.ibb.co/nM7Hm2rk/7525463b4bb9.jpg",
      "https://i.ibb.co/CT0BrK5/eeb711969a10.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/icecream_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo ice cream apka ly! 🍦`,
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

