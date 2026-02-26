const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "engage",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Engagement prank for group members.",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/BV3zdsDn/928f93438605.jpg";
const templatePath = path.join(cacheDir, "engage_template.png");

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const engagementMessages = [
  "𝐒𝐡𝐞 𝐬𝐚𝐢𝐝 𝐘𝐄𝐒! 💍",
  "𝐓𝐰𝐨 𝐡𝐞𝐚𝐫𝐭𝐬, 𝐨𝐧𝐞 𝐩𝐫𝐨𝐦𝐢𝐬𝐞 💎",
  "𝐄𝐧𝐠𝐚𝐠𝐞𝐝 𝐚𝐧𝐝 𝐢𝐧 𝐥𝐨𝐯𝐞 💕",
  "𝐅𝐨𝐫𝐞𝐯𝐞𝐫 𝐬𝐭𝐚𝐫𝐭𝐬 𝐧𝐨𝐰 💝",
  "𝐌𝐲 𝐛𝐞𝐬𝐭 𝐲𝐞𝐬 𝐞𝐯𝐞𝐫! 💖",
  "𝐏𝐫𝐨𝐦𝐢𝐬𝐞𝐝 𝐭𝐨 𝐞𝐚𝐜𝐡 𝐨𝐭𝐡𝐞𝐫 💞",
  "𝐋𝐨𝐯𝐞 𝐬𝐞𝐚𝐥𝐞𝐝 𝐰𝐢𝐭𝐡 𝐚 𝐫𝐢𝐧𝐠 💍✨",
  "𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 𝐭𝐢𝐥𝐥 𝐞𝐭𝐞𝐫𝐧𝐢𝐭𝐲 🌹"
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

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions);

  try {
    await downloadTemplate();

    let one = senderID;
    let two;
    let senderInfo = await getUserInfo(api, senderID);
    let senderGender = senderInfo.gender === 1 ? "female" : senderInfo.gender === 2 ? "male" : detectGender(senderInfo.name || "");

    if (mention[0]) {
      two = mention[0];
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

    const circleOne = await makeCircularImage(avatarOne, 100);
    const circleTwo = await makeCircularImage(avatarTwo, 100);

    const template = await Jimp.read(templatePath);

    template.composite(circleOne, 52, 95);
    template.composite(circleTwo, 190, 95);

    const outputPath = path.join(cacheDir, `engage_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    const userOneInfo = await getUserInfo(api, one);
    const userTwoInfo = await getUserInfo(api, two);
    const nameOne = userOneInfo.name || "User 1";
    const nameTwo = userTwoInfo.name || "User 2";
    const randomMsg = engagementMessages[Math.floor(Math.random() * engagementMessages.length)];

    api.sendMessage(
      {
        body: `≿━━━━༺💍༻━━━━≾\n\n${randomMsg}\n\n👤 ${nameOne}\n💍 𝐄𝐍𝐆𝐀𝐆𝐄𝐃 𝐓𝐎 💍\n👤 ${nameTwo}\n\n≿━━━━༺💍༻━━━━≾`,
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
    console.error("Engage command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐞𝐧𝐠𝐚𝐠𝐞𝐦𝐞𝐧𝐭 𝐢𝐦𝐚𝐠𝐞!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};

