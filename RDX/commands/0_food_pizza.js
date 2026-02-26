const request = require("request");
const fs = require("fs");

module.exports = {
  config: {
    name: 'pizza',
    aliases: ['piza', 'piazza', 'piz', 'pizz', 'italian pizza'],
    description: 'Send a pizza image',
    credits: "SARDAR RDX",
    usage: '.pizza',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [ 
      "https://i.ibb.co/spXqrkZ7/c68e92889bcd.jpg",
      "https://i.ibb.co/BHWs6KVr/c62dfd0b8de4.jpg",
      "https://i.ibb.co/PsS6pMGX/def448a0201b.jpg",
      "https://i.ibb.co/k25ZZMMv/7843c13ec84a.jpg"
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/pizza_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo pizza apka ly! 🍕`,
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

