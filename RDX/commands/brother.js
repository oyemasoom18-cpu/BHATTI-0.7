const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "brother",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Find your brother in the group.",
  commandCategory: "Family",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/ZzYT1wFh/58877ad2763d.jpg";
const templatePath = path.join(cacheDir, "brother_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 190,
    X: 12,
    Y: 150
  },
  AVATAR_2: {
    SIZE: 190,
    X: 279,
    Y: 150
  }
};

const brotherMessages = [
  "𝐁𝐡𝐚𝐢 𝐛𝐡𝐚𝐢 𝐤𝐚 𝐩𝐲𝐚𝐚𝐫 𝐬𝐚𝐛𝐬𝐞 𝐚𝐥𝐚𝐠 𝐡𝐚𝐢 💪❤️",
  "𝐌𝐞𝐫𝐚 𝐁𝐡𝐚𝐢, 𝐌𝐞𝐫𝐢 𝐉𝐚𝐚𝐧! 🌟",
  "𝐁𝐫𝐨𝐭𝐡𝐞𝐫𝐬 𝐟𝐨𝐫𝐞𝐯𝐞𝐫! 🤝",
  "𝐃𝐮𝐧𝐢𝐲𝐚 𝐞𝐤 𝐭𝐚𝐫𝐚𝐟, 𝐁𝐡𝐚𝐢 𝐞𝐤 𝐭𝐚𝐫𝐚𝐟 👑",
  "𝐁𝐡𝐚𝐢 𝐡𝐚𝐢 𝐭𝐨𝐡 𝐤𝐲𝐚 𝐠𝐡𝐚𝐦 𝐡𝐚𝐢 🔥"
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

    if (two == one) return api.sendMessage("❌ Aap apne bhai ke liye kisi aur ko select karein!", threadID, messageID);

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeCircularImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(circleTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);

    if (!nameOne || nameOne == "Facebook User") {
        const infoOne = await api.getUserInfo(one);
        nameOne = infoOne[one]?.name || "User 1";
    }
    if (!nameTwo || nameTwo == "Facebook User") {
        const infoTwo = await api.getUserInfo(two);
        nameTwo = infoTwo[two]?.name || "User 2";
    }

    try {
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        template.print({
            font: font,
            x: SETTINGS.AVATAR_1.X,
            y: SETTINGS.AVATAR_1.Y + (SETTINGS.AVATAR_1.SIZE / 2) - 16,
            text: { text: nameOne, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
            maxWidth: SETTINGS.AVATAR_1.SIZE
        });
        template.print({
            font: font,
            x: SETTINGS.AVATAR_2.X,
            y: SETTINGS.AVATAR_2.Y + (SETTINGS.AVATAR_2.SIZE / 2) - 16,
            text: { text: nameTwo, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
            maxWidth: SETTINGS.AVATAR_2.SIZE
        });
    } catch (fontError) {
        console.error("Font rendering error:", fontError);
    }

    const outputPath = path.join(cacheDir, `bro_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);
    const randomMsg = brotherMessages[Math.floor(Math.random() * brotherMessages.length)];
    const broPower = Math.floor(Math.random() * 21) + 80;

    api.sendMessage({
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  🛡️ ${nameOne}\n  🔥 𝐁𝐫𝐨𝐭𝐡𝐞𝐫𝐬 𝐁𝐨𝐧𝐝 🔥\n  🛡️ ${nameTwo}\n\n  💪 𝐁𝐫𝐨 𝐏𝐨𝐰𝐞𝐫: ${broPower}%\n\n◈━━━━━━━━━━━━◈\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Brother command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐞𝐝𝐢𝐭!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};
