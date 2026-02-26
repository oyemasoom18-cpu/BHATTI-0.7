const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'barfi',
    aliases: ['barf', 'barfee', 'burfi', 'barfy', 'mithai'],
    description: 'Send a barfi image',
    credits: "SARDAR RDX",
    usage: '.barfi',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/SXtJ8wBV/d3f4a1c07616.jpg",
      "https://i.ibb.co/ds1krGZL/62a5888c271d.jpg",
      "https://i.ibb.co/fdRP6hhN/707a3f235d0c.jpg",
      "https://i.ibb.co/27tNQK6h/6060868fba1e.jpg",
      "https://i.ibb.co/Tzwy0Bp/17d315cd68f7.jpg",
      "https://i.ibb.co/27tNQK6h/6060868fba1e.jpg",
      "https://i.ibb.co/m5cXnW7m/9e08926c9689.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/barfi_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo barfi apka ly! 🤎`,
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

