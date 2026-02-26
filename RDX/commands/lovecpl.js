const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "lovecpl",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Celebrate love with couple animations.",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/bg17zV2B/cf03e1e539e5.jpg";
const templatePath = path.join(cacheDir, "lovecpl_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 164,
    X: 35,
    Y: 154
  },
  AVATAR_2: {
    SIZE: 164,
    X: 252,
    Y: 152
  }
};

const coupleMessages = [
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐚 𝐬𝐚𝐭𝐡 𝐡𝐢 𝐦𝐞𝐫𝐢 𝐣𝐚𝐧𝐧𝐚𝐭 𝐡𝐚𝐢 🌸",
  "𝐃𝐢𝐥 𝐤𝐢 𝐡𝐚𝐫 𝐝𝐞𝐞𝐰𝐚𝐫 𝐩𝐚𝐫 𝐭𝐮𝐦𝐡𝐚𝐫𝐚 𝐧𝐚𝐚𝐦 𝐡𝐚𝐢 ❤️",
  "𝐙𝐢𝐧𝐝𝐚𝐠𝐢 𝐛𝐚𝐡𝐮𝐭 𝐤𝐡𝐨𝐨𝐛𝐬𝐮𝐫𝐚𝐭 𝐡𝐚𝐢 𝐭𝐮𝐦𝐡𝐚𝐫𝐞 𝐬𝐚𝐭𝐡 💖",
  "𝐌𝐞𝐫𝐢 𝐫𝐨𝐨𝐡 𝐦𝐞𝐢𝐧 𝐛𝐚𝐬 𝐠𝐚𝐲𝐞 𝐡𝐨 𝐭𝐮𝐦 ✨"
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

    const outputPath = path.join(cacheDir, `lovecpl_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = coupleMessages[Math.floor(Math.random() * coupleMessages.length)];
    const loveRatio = Math.floor(Math.random() * 41) + 60;

    api.sendMessage({
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  💌 ${nameOne}\n  💞 𝐋𝐨𝐯𝐞 𝐂𝐨𝐮𝐩𝐥𝐞 💞\n  💌 ${nameTwo}\n\n  💝 𝐋𝐨𝐯𝐞 𝐒𝐜𝐨𝐫𝐞: ${loveRatio}%\n\n◈━━━━━━━━━━━━◈`,
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  💌 ${nameOne}\n  💞 𝐋𝐨𝐯𝐞 𝐂𝐨𝐮𝐩𝐥𝐞 💞\n  💌 ${nameTwo}\n\n  💝 𝐋𝐨𝐯𝐞 𝐒𝐜𝐨𝐫𝐞: ${loveRatio}%\n\n◈━━━━━━━━━━━━◈\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Lovecpl command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐞𝐝𝐢𝐭!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};
