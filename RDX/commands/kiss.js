const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "kiss",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Kiss a mentioned user with an animation.",
  commandCategory: "Love",
  usages: "[tag/reply]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, Users }) => {
  const slapGifs = [
    "https://i.postimg.cc/yxDKkJyH/02d4453f3eb0a76a87148433395b3ec3.gif",
    "https://i.postimg.cc/nLTf2Kdx/1483589602-6b6484adddd5d3e70b9eaaaccdf6867e.gif",
    "https://i.postimg.cc/Wpyjxnsb/574fcc797b21e-1533876813029926506824.gif",
    "https://i.postimg.cc/xdsT8SVL/kiss-anime.gif",
  ];

  try {
    let targetID;
    if (event.type == "message_reply") {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }

    if (!targetID) {
      return api.sendMessage("╭──────────────╮\n       ⚠️  𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍  ⚠️\n╰──────────────╯\n\n❗ Please tag someone or reply to their message to give a kiss!\n\n━━━━━━━━━━━━━━━━━", event.threadID, event.messageID);
    }

    if (targetID == event.senderID) return api.sendMessage("❌ Aap apne aap ko kiss nahi kar sakte!", event.threadID, event.messageID);

    let name = await Users.getNameUser(targetID);
    if (!name || name.includes("Facebook User")) {
      const info = await api.getUserInfo(targetID);
      name = info[targetID].name || "Jaan";
    }

    const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const gifPath = path.join(cacheDir, `kiss_${Date.now()}.gif`);
    const response = await axios.get(randomGif, { responseType: "arraybuffer" });
    fs.writeFileSync(gifPath, Buffer.from(response.data));

    return api.sendMessage({
      body: `╭──────────────╮\n       ❤️  𝐒𝐖𝐄𝐄𝐓 𝐊𝐈𝐒𝐒  ❤️\n╰──────────────╯\n\n👤 ${name}, 𝐁𝐚𝐞 𝐠𝐢𝐯𝐞 𝐦𝐞 𝐚 𝐬𝐰𝐞𝐞𝐭 𝐤𝐢𝐬𝐬 💞\n\n━━━━━━━━━━━━━━━━━`,
      mentions: [{ tag: name, id: targetID }],
      attachment: fs.createReadStream(gifPath)
    }, event.threadID, () => {
      if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
    }, event.messageID);

  } catch (error) {
    console.error("Kiss command error:", error);
    return api.sendMessage('❌ Error: ' + error.message, event.threadID, event.messageID);
  }
};
