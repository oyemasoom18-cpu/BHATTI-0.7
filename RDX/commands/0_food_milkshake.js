const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'milkshake',
    aliases: ['milk', 'shake', 'milshake', 'milkshake', 'shakey'],
    description: 'Send a milk shake image',
    credits: "SARDAR RDX",
    usage: '.milkshake',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/ZpdzGc8q/308fee130a99.jpg",
      "https://i.ibb.co/hx83fS0w/7112d609c43f.jpg",
      "https://i.ibb.co/JWstZH8H/c85a112aaaca.jpg",
      "https://i.ibb.co/GgFXdRX/a5be66e9f6e2.jpg",
      "https://i.ibb.co/Lzz81Ld5/aa6cdf96b80a.jpg",
      "https://i.ibb.co/FkJVdVf8/6b276c407771.jpg",
      "https://i.ibb.co/VccHhKdd/d4b82bd3fea8.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/milkshake_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo milk shake apka ly! 🥛`,
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

