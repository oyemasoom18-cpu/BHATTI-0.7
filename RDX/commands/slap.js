const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'slap',
    aliases: ['hit', 'punch', 'beat', 'thapar', 'chmat', 'lgu', 'moh tor', 'chpat', 'mara', 'maro', 'aik lga'],
    description: "Slap a mentioned user with an animation.",
    credits: "SARDAR RDX",
    usage: 'slap [@mention/reply]',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, Users }) {
    const slapGifs = [
      "https://i.ibb.co/k6QxCP7w/8527c64e686a.gif",
      "https://i.ibb.co/Jj4GhPps/4f14c0f398b3.gif",
      "https://i.ibb.co/JR8fqsFR/0a59a3880c88.gif",
      "https://i.ibb.co/8Dtrdf14/de975c771b07.gif",
      "https://i.ibb.co/DgPT6D5m/fb9ecb7d44a0.gif"
    ];

    try {
      let victimID;
      
      if (event.type == "message_reply") {
        victimID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions).length > 0) {
        victimID = Object.keys(event.mentions)[0];
      } else {
        return api.sendMessage('🚫 برائے کرم کسی کو ٹیگ کریں یا اس کے میسج کا ریپلائی دیں!\n\n(Please tag someone or reply to their message to slap!)', event.threadID, event.messageID);
      }

      if (!victimID) return api.sendMessage("❌ Victim ID nahi mil saki!", event.threadID, event.messageID);
      if (victimID == event.senderID) return api.sendMessage("❌ Aap apne aap ko thapar nahi maar sakte!", event.threadID, event.messageID);

      let victimName = await Users.getNameUser(victimID);
      if (!victimName || victimName.includes("Facebook User")) {
        const info = await api.getUserInfo(victimID);
        victimName = info[victimID].name || "User";
      }
      
      const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
      
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const gifPath = path.join(cacheDir, `slap_${Date.now()}.gif`);
      const response = await axios.get(randomGif, { responseType: "arraybuffer" });
      fs.writeFileSync(gifPath, Buffer.from(response.data));

      return api.sendMessage({
        body: `💥 *SLAP ATTACK*\n\n👤 Name: ${victimName}\n\nSORRY MEKO LGA MACHAR HY 😤👋)`,
        mentions: [{ tag: victimName, id: victimID }],
        attachment: fs.createReadStream(gifPath)
      }, event.threadID, () => {
        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      }, event.messageID);

    } catch (error) {
      console.error("Slap command error:", error);
      return api.sendMessage('❌ Error: ' + error.message, event.threadID, event.messageID);
    }
  }
};
