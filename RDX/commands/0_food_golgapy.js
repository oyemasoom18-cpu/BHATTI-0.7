const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'golgapy',
    aliases: ['gol', 'golggapy', 'pani puri', 'gol gappy', 'panipuri'],
    description: 'Send a golgapy image',
    credits: "SARDAR RDX",
    usage: '.golgapy',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/k2NwGgc8/ede759508160.jpg",
      "https://i.ibb.co/Kj9MhpZL/68e42e07c04b.jpg",
      "https://i.ibb.co/4ZvVcSnk/a14c13ec5c55.jpg",
      "https://i.ibb.co/LDNKH0mt/f9f099213dec.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/golgapy_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo golgapy apka ly! 🥤`,
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

