const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "watch",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Create a watch pair edit with romantic poetry",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.postimg.cc/4xBkjr2h/1d7bf01f9f774e687566259fd7fef721.jpg";
const templatePath = path.join(cacheDir, "watch_template.png");

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const romanticPoetry = [
  "❝ 𝐘𝐨𝐮 & 𝐈 𝐚𝐫𝐞 𝐭𝐰𝐨 𝐬𝐨𝐮𝐥𝐬 𝐰𝐫𝐢𝐭𝐭𝐞𝐧 𝐢𝐧 𝐭𝐡𝐞 𝐬𝐚𝐦𝐞 𝐥𝐨𝐯𝐞 𝐬𝐭𝐨𝐫𝐲 ❞ 💖",
  "❝ 𝐄𝐯𝐞𝐫𝐲 𝐠𝐥𝐚𝐧𝐜𝐞 𝐨𝐟 𝐲𝐨𝐮𝐫𝐬 𝐬𝐭𝐞𝐚𝐥𝐬 𝐚 𝐩𝐢𝐞𝐜𝐞 𝐨𝐟 𝐦𝐲 𝐡𝐞𝐚𝐫𝐭 ❞ 💕",
  "❝ 𝐈𝐧 𝐲𝐨𝐮𝐫 𝐞𝐲𝐞𝐬, 𝐈 𝐟𝐨𝐮𝐧𝐝 𝐭𝐡𝐞 𝐡𝐨𝐦𝐞 𝐈 𝐰𝐚𝐬 𝐬𝐞𝐚𝐫𝐜𝐡𝐢𝐧𝐠 𝐟𝐨𝐫 ❞ 🌹",
  "❝ 𝐋𝐨𝐯𝐞 𝐢𝐬 𝐧𝐨𝐭 𝐚𝐛𝐨𝐮𝐭 𝐭𝐢𝐦𝐞, 𝐢𝐭'𝐬 𝐚𝐛𝐨𝐮𝐭 𝐭𝐡𝐞 𝐦𝐨𝐦𝐞𝐧𝐭𝐬 𝐰𝐞 𝐜𝐫𝐞𝐚𝐭𝐞 ❞ ✨",
  "❝ 𝐓𝐰𝐨 𝐡𝐞𝐚𝐫𝐭𝐬, 𝐨𝐧𝐞 𝐫𝐡𝐲𝐭𝐡𝐦, 𝐢𝐧𝐟𝐢𝐧𝐢𝐭𝐞 𝐦𝐞𝐦𝐨𝐫𝐢𝐞𝐬 ❞ 💞",
  "❝ 𝐖𝐢𝐭𝐡 𝐲𝐨𝐮, 𝐞𝐯𝐞𝐫𝐲 𝐬𝐞𝐜𝐨𝐧𝐝 𝐟𝐞𝐞𝐥𝐬 𝐥𝐢𝐤𝐞 𝐩𝐨𝐞𝐭𝐫𝐲 ❞ 🥀"
];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(templatePath)) {
    const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
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

function detectGender(name) {
  const lowerName = name.toLowerCase();
  if (femaleNames.some(n => lowerName.includes(n))) return "female";
  if (maleNames.some(n => lowerName.includes(n))) return "male";
  return "unknown";
}

async function getThreadMembers(api, threadID) {
  return new Promise((resolve) => {
    api.getThreadInfo(threadID, (err, info) => {
      if (err) return resolve([]);
      resolve(info.participantIDs || []);
    });
  });
}

async function getUserInfo(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return resolve({});
      resolve(info[uid] || {});
    });
  });
}

module.exports.run = async ({ api, event, Users, Currencies }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);

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
      two = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else {
      const members = await getThreadMembers(api, threadID);
      const filteredMembers = members.filter(m => m !== senderID);

      if (filteredMembers.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝 𝐭𝐨 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }

      let oppositeGenderMembers = [];
      for (const uid of filteredMembers) {
        const info = await getUserInfo(api, uid);
        const memberGender = info.gender === 1 ? "female" : info.gender === 2 ? "male" : detectGender(info.name || "");
        
        if (senderGender === "male" && memberGender === "female") {
          oppositeGenderMembers.push(uid);
        } else if (senderGender === "female" && memberGender === "male") {
          oppositeGenderMembers.push(uid);
        } else if (senderGender === "unknown" || memberGender === "unknown") {
          oppositeGenderMembers.push(uid);
        }
      }

      if (oppositeGenderMembers.length === 0) {
        oppositeGenderMembers = filteredMembers;
      }

      two = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];
    }

    const avatarOne = await getAvatar(one);
    const avatarTwo = await getAvatar(two);

    const circleOne = await makeCircularImage(avatarOne, 114);
    const circleTwo = await makeCircularImage(avatarTwo, 118);

    const template = await Jimp.read(templatePath);

    template.composite(circleOne, 45, 367);
    template.composite(circleTwo, 386, 433);

    const outputPath = path.join(cacheDir, `watch_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    const userOneInfo = await getUserInfo(api, one);
    const userTwoInfo = await getUserInfo(api, two);
    const nameOne = userOneInfo.name || "User 1";
    const nameTwo = userTwoInfo.name || "User 2";
    const randomPoetry = romanticPoetry[Math.floor(Math.random() * romanticPoetry.length)];

    api.sendMessage(
      {
        body: `≿━━━━༺💝༻━━━━≾\n\n${randomPoetry}\n\n👤 ${nameOne}\n⌚ 𝐖𝐀𝐓𝐂𝐇 𝐏𝐀𝐈𝐑 ⌚\n👤 ${nameTwo}\n\n≿━━━━༺💝༻━━━━≾\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
        attachment: fs.createReadStream(outputPath),
        mentions: [
          { tag: nameOne, id: one },
          { tag: nameTwo, id: two }
        ]
      },
      threadID,
      () => fs.unlinkSync(outputPath),
      messageID
    );

  } catch (error) {
    console.error("Watch command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐰𝐚𝐭𝐜𝐡 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};

