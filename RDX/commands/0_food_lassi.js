const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'lassi',
    aliases: ['lassee', 'lassy', 'lassi', 'yogurt drink', 'drink'],
    description: 'Send a lassi image',
    credits: "SARDAR RDX",
    usage: '.lassi',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/Q7zzN5Dd/90674709056d.jpg",
      "https://i.ibb.co/cSg2mYDr/c97a0916274f.jpg",
      "https://i.ibb.co/gMx83j43/aa6b14a22144.jpg",
      "https://i.ibb.co/h1BQsGfr/2d566af526b1.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/lassi_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo lassi apka ly! 🥤`,
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

