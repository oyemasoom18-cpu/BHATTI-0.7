const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'chicken',
    aliases: ['chick', 'murghi', 'murgh', 'murga', 'poultry'],
    description: 'Send a chicken image',
    credits: "SARDAR RDX",
    usage: '.chicken',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/C3s0kL6D/b8d5bf18fdd4.jpg",
      "https://i.ibb.co/wFgySXxD/5a6f068f3b5c.jpg",
      "https://i.ibb.co/fdRD7zK0/4f48e07c4cb2.jpg",
      "https://i.ibb.co/fdRD7zK0/4f48e07c4cb2.jpg",
      "https://i.ibb.co/gZgRfddC/54bf19e537bc.jpg",
      "https://i.ibb.co/tT56PvDp/8289efdb75fb.jpg",
      "https://i.ibb.co/677HmDGy/2f1120a8dd24.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/chicken_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo chicken apka ly! 🍗`,
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

