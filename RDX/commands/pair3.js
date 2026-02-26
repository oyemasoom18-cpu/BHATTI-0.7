const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "pair3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Create a romantic pair edit with profile pics (random, mention, reply)",
  commandCategory: "Love",
  usages: "pair3 [@mention/reply]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/q3DDkP9D/9fe55575821c.jpg";
const templatePath = path.join(cacheDir, "pair_template.png");

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const romanticMessages = [
  "𝐓𝐰𝐨 𝐬𝐨𝐮𝐥𝐬, 𝐨𝐧𝐞 𝐡𝐞𝐚𝐫𝐭 💖",
  "𝐋𝐨𝐯𝐞 𝐢𝐬 𝐢𝐧 𝐭𝐡𝐞 𝐚𝐢𝐫 💕",
  "𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐦𝐚𝐭𝐜𝐡 𝐦𝐚𝐝𝐞 𝐢𝐧 𝐡𝐞𝐚𝐯𝐞𝐧 🌹",
  "𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 𝐟𝐨𝐫𝐞𝐯𝐞𝐫 💞",
  "𝐌𝐲 𝐡𝐞𝐚𝐫𝐭 𝐛𝐞𝐥𝐨𝐧𝐠𝐬 𝐭𝐨 𝐲𝐨𝐮 💗",
  "𝐋𝐨𝐯𝐞 𝐚𝐭 𝐟𝐢𝐫𝐬𝐭 𝐬𝐢𝐠𝐡𝐭 ❤️",
  "𝐘𝐨𝐮 𝐚𝐫𝐞 𝐦𝐲 𝐞𝐯𝐞𝐫𝐲𝐭𝐡𝐢𝐧𝐠 💝",
  "𝐒𝐨𝐮𝐥𝐦𝐚𝐭𝐞𝐬 𝐟𝐨𝐫 𝐥𝐢𝐟𝐞 🥀"
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
  const lowerName = name ? name.toLowerCase() : "";
  if (femaleNames.some(n => lowerName.includes(n))) return "female";
  if (maleNames.some(n => lowerName.includes(n))) return "male";
  return "unknown";
}

module.exports.run = async ({ api, event, Users, Currencies, args }) => {
  const { threadID, messageID, senderID } = event;
  const botID = api.getCurrentUserID();

  try {
    const COST = 10;
    const charge = await chargeUser(Currencies, senderID, COST);
    if (!charge.success) return api.sendMessage(`❌ Aapka balance low hy.\n💰 Price: ${COST} coins\n💵 Your Total: ${charge.total || 0}`, threadID, messageID);

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
      const participantIDs = threadInfo.participantIDs;
      
      const infoOne = await api.getUserInfo(one);
      const genderOne = infoOne[one].gender === 1 ? "female" : infoOne[one].gender === 2 ? "male" : detectGender(infoOne[one].name);

      const filteredMembers = participantIDs.filter(m => m !== senderID && m !== botID);
      if (filteredMembers.length === 0) {
        return api.sendMessage("❌ Group mein koi aur member nahi mila!", threadID, messageID);
      }

      let oppositeGenderMembers = [];
      const batchInfo = await api.getUserInfo(filteredMembers);
      
      for (const uid of filteredMembers) {
        const info = batchInfo[uid];
        const memberGender = info.gender === 1 ? "female" : info.gender === 2 ? "male" : detectGender(info.name);
        
        if (genderOne === "male" && memberGender === "female") {
          oppositeGenderMembers.push(uid);
        } else if (genderOne === "female" && memberGender === "male") {
          oppositeGenderMembers.push(uid);
        } else if (genderOne === "unknown" || memberGender === "unknown") {
          oppositeGenderMembers.push(uid);
        }
      }

      if (oppositeGenderMembers.length === 0) oppositeGenderMembers = filteredMembers;
      two = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];
    }

    if (two == one) return api.sendMessage("❌ Aap apne saath pairing nahi kar sakte!", threadID, messageID);

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([makeCircularImage(avatarOne, 117), makeCircularImage(avatarTwo, 117)]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, 48, 175);
    template.composite(circleTwo, 310, 170);

    const outputPath = path.join(cacheDir, `pair3_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];

    api.sendMessage(
      {
        body: `≿━━━━༺💝༻━━━━≾\n\n${randomMsg}\n\n👤 ${nameOne}\n💕 𝐏𝐀𝐈𝐑𝐄𝐃 𝐖𝐈𝐓𝐇 💕\n👤 ${nameTwo}\n\n≿━━━━༺💝༻━━━━≾\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
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
    console.error("Pair3 command error:", error);
    api.sendMessage("❌ Error: " + error.message, threadID, messageID);
  }
};
