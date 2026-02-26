const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'gulabjaman',
    aliases: ['gulab', 'jaman', 'jamun', 'gulab jamun', 'sweet'],
    description: 'Send a gulab jaman image',
    credits: "SARDAR RDX",
    usage: '.gulabjaman',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/5W1G69Sp/8a24d98be3f8.jpg",
      "https://i.ibb.co/B5nBK19p/588bb17d06fc.jpg",
      "https://i.ibb.co/DPCtv0R4/2344db972873.jpg",
      "https://i.ibb.co/4ZzPcPgK/32f091005182.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/gulabjaman_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo gulab jaman apka ly! 🤎`,
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

