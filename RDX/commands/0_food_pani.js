const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'pani',
    aliases: ['water', 'panu', 'paani', 'liquid', 'drink'],
    description: 'Send a pani image',
    credits: "SARDAR RDX",
    usage: '.pani',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/N2LHDfbx/c36d30e80175.jpg",
      "https://i.ibb.co/LhpTKpzD/bedb4648ffa1.jpg",
      "https://i.ibb.co/pvwhWRrt/4a620e07c13e.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/pani_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo pani apka ly! 💧`,
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

