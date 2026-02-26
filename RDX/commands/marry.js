const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "marry",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Propose and marry another user.",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/673cMdk6/3dbd4f9bf45a.jpg"; 
const templatePath = path.join(cacheDir, "marry_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 180,
    X: 21,
    Y: 300
  },
  AVATAR_2: {
    SIZE: 180,
    X: 275,
    Y: 300
  }
};

const marryMessages = [
  "𝐖𝐢𝐥𝐥 𝐲𝐨𝐮 𝐦𝐚𝐫𝐫𝐲 𝐦𝐞? 💍❤️",
  "𝐙𝐢𝐧𝐝𝐚𝐠𝐢 𝐛𝐡𝐚𝐫 𝐤𝐚 𝐬𝐚𝐭𝐡 𝐜𝐡𝐚𝐡𝐢𝐲𝐞 ✨",
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐞 𝐬𝐚𝐭𝐡 𝐠𝐡𝐚𝐫 𝐛𝐚𝐬𝐚𝐧𝐚 𝐡𝐚𝐢 🏠💞",
  "𝐌𝐞𝐫𝐢 𝐝𝐮𝐥𝐡𝐚𝐧 𝐛𝐚𝐧𝐨 𝐠𝐢? 👰💖",
  "𝐄𝐤 𝐧𝐚𝐲𝐢 𝐳𝐢𝐧𝐝𝐚𝐠𝐢 𝐤𝐢 𝐬𝐡𝐮𝐫𝐮𝐰𝐚𝐚𝐭 🌸"
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
      return api.sendMessage(`❌ Aapke paas ${COST} coins nahi hain.\n💰 Required: ${COST} coins\n💵 Your Total: ${charge.total || 0} coins`, threadID, messageID);
    }
    await downloadTemplate();

    let one = senderID;
    let two;

    if (Object.keys(event.mentions).length > 0) {
      two = Object.keys(event.mentions)[Object.keys(event.mentions).length - 1];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else if (args && args.length > 0 && args[0].match(/^\d+$/)) {
      two = args[0];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs.filter(m => m !== senderID && m !== botID);
      
      if (participantIDs.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }
      two = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    }

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeCircularImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(circleTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `marry_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = marryMessages[Math.floor(Math.random() * marryMessages.length)];

    api.sendMessage(
      {
        body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  🤵 ${nameOne}\n  💍 𝐌𝐚𝐫𝐫𝐲 𝐌𝐞 💍\n  👰 ${nameTwo}\n\n◈━━━━━━━━━━━━◈\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
        attachment: fs.createReadStream(outputPath),
        mentions: [
          { tag: nameOne, id: one },
          { tag: nameTwo, id: two }
        ]
      },
      threadID,
      () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      },
      messageID
    );

  } catch (error) {
    console.error("Marry command error:", error);
    api.sendMessage("❌ Error creating edit!", threadID, messageID);
  }
};

