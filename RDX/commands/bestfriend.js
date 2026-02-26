const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "bestfriend",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Find your best friend in the group.",
  commandCategory: "Friendship",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/01PG4jd/690b1e765215.jpg";
const templatePath = path.join(cacheDir, "bestfriend_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 185,
    X: 116,
    Y: 100
  },
  AVATAR_2: {
    SIZE: 185,
    X: 409,
    Y: 100
  }
};

const friendshipMessages = [
  "𝐃𝐨𝐬𝐭𝐢 𝐡𝐢 𝐚𝐬𝐥𝐢 𝐭𝐚𝐪𝐚𝐭 𝐡𝐚𝐢 🤝✨",
  "𝐓𝐮𝐦 𝐣𝐚𝐢𝐬𝐚 𝐲𝐚𝐚𝐫 𝐤𝐚𝐡𝐚𝐧... ❤️",
  "𝐁𝐞𝐬𝐭 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐅𝐨𝐫𝐞𝐯𝐞𝐫! 👭👬",
  "𝐇𝐚𝐫 𝐦𝐮𝐬𝐡𝐤𝐢𝐥 𝐦𝐞𝐢𝐧 𝐭𝐮𝐦𝐡𝐚𝐫𝐚 𝐬𝐚𝐭𝐡 𝐡𝐚𝐢 🌟",
  "𝐘𝐚𝐚𝐫𝐢 𝐡𝐚𝐢 𝐢𝐦𝐚𝐚𝐧 𝐦𝐞𝐫𝐚... 🎶"
];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(templatePath)) {
    try {
      const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(templatePath, Buffer.from(response.data));
    } catch (e) {
      console.error("Template download error:", e);
    }
  }
}

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

async function makeCircularImage(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  const center = size / 2;
  const radius = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (dist <= radius) {
        mask.setPixelColor(0xFFFFFFFF, x, y);
      }
    }
  }
  image.mask(mask, 0, 0);
  return image;
}

module.exports.run = async ({ api, event, Users, Currencies, args }) => {
  const { threadID, messageID, senderID } = event;
  const botID = api.getCurrentUserID();

  try {
    const COST = 10;
    const charge = await chargeUser(Currencies, senderID, COST);
    if (!charge.success) {
      return api.sendMessage(`≿━━━━༺❀༻━━━━≾\n❌ Aapke paas coins kam hain!\n💰 Required: ${COST} coins\n💵 Your Total: ${charge.total || 0}\n≿━━━━༺❀༻━━━━≾`, threadID, messageID);
    }

    await downloadTemplate();
    let one = senderID;
    let two;

    if (Object.keys(event.mentions).length > 0) {
      two = Object.keys(event.mentions)[Object.keys(event.mentions).length - 1];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else if (args.join(" ").match(/\d+/g)) {
      const uids = args.join(" ").match(/\d+/g);
      two = uids[uids.length - 1];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs.filter(m => m !== senderID && m !== botID);
      if (participantIDs.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }
      two = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    }

    if (two == one) return api.sendMessage("❌ Aap apne saath pairing nahi kar sakte!", threadID, messageID);

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeCircularImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(circleTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `bf_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = friendshipMessages[Math.floor(Math.random() * friendshipMessages.length)];
    const friendshipScore = Math.floor(Math.random() * 21) + 80;

    api.sendMessage({
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  💌 ${nameOne}\n  🤝 𝐁𝐞𝐬𝐭 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 🤝\n  💌 ${nameTwo}\n\n  💝 𝐁𝐨𝐧𝐝𝐢𝐧𝐠: ${friendshipScore}%\n\n◈━━━━━━━━━━━━◈`,
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  💌 ${nameOne}\n  🤝 𝐁𝐞𝐬𝐭 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 🤝\n  💌 ${nameTwo}\n\n  💝 𝐁𝐨𝐧𝐝𝐢𝐧𝐠: ${friendshipScore}%\n\n◈━━━━━━━━━━━━◈\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Bestfriend command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐞𝐝𝐢𝐭!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};
