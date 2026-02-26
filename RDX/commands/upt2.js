const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const moment = require('moment-timezone');

const cacheDir = path.join(__dirname, "cache", "upt");
const localBgPath = path.join(__dirname, 'assets', 'upt2_bg.jpg');
const remoteBgUrl = "https://i.ibb.co/fYVBxsHR/a5d5f38e5a81.jpg";

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "upt2",
    version: "1.4.0",
    author: "Sardar RDX",
    countDown: 5,
    role: 0,
    description: "Uptime v2 with granular text control (Clean Code)",
    category: "system",
    guide: "{pn}",
    prefix: true
  },

  run: async function({ api, event, config }) {
    const { threadID, messageID } = event;
    const outputPath = path.join(cacheDir, `upt2_${threadID}_${Date.now()}.png`);
    const tempPath = path.join(cacheDir, "temp_bg_v4.jpg");

    await api.sendMessage({
      body: "⚡ | Checking system status, please wait...",
    }, threadID, messageID);

    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      if (!fs.existsSync(tempPath)) {
        const response = await axios.get(remoteBgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempPath, Buffer.from(response.data));
      }

      const uptime = process.uptime();
      const days = Math.floor(uptime / (24 * 3600));
      const hours = Math.floor((uptime % (24 * 3600)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const uptStr = `${days}D:${hours < 10 ? "0" + hours : hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
      const uptShort = `${hours < 10 ? "0" + hours : hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

      const timeStr = moment().tz('Asia/Karachi').format('hh:mm:ss A');
      const dateStr = moment().tz('Asia/Karachi').format('DD/MM/YYYY');
      const botNameNick = config.BOTNAME || "SARDAR RDX";

      const uniqueCommands = new Set();
      global.client.commands.forEach((cmd) => {
        if (cmd.config && cmd.config.name) {
          uniqueCommands.add(cmd.config.name.toLowerCase());
        }
      });
      const commandsCount = uniqueCommands.size;
      const eventsCount = global.client.events.size;

      const image = await loadImage(tempPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';

      const botNameSize = 80;
      const botNameX = canvas.width / 2;
      const botNameY = 190;
      ctx.font = `bold ${botNameSize}px Georgia`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f7ff';
      ctx.fillText("RDX BOT", botNameX, botNameY);

      const uptimeSize = 45;
      const uptimeX = canvas.width / 2;
      const uptimeY = 270;
      ctx.shadowColor = '#00e5ff';
      ctx.font = `italic bold ${uptimeSize}px Georgia`;
      ctx.shadowBlur = 20;
      ctx.fillText(`UPTIME: ${uptStr}`, uptimeX, uptimeY);
      ctx.shadowBlur = 40;
      ctx.fillText(`UPTIME: ${uptStr}`, uptimeX, uptimeY);

      const timeLabelSize = 33;
      const timeLabelX = canvas.width / 5.7;
      const timeLabelY = 400;
      ctx.shadowBlur = 0;
      ctx.font = `bold ${timeLabelSize}px Arial`;
      ctx.fillText("TIME:", timeLabelX, timeLabelY);

      const timeValueSize = 20;
      const timeValueX = canvas.width / 2.6;
      const timeValueY = 400;
      ctx.font = `${timeValueSize}px Arial`;
      ctx.fillText(timeStr, timeValueX, timeValueY);

      const dateLabelSize = 33;
      const dateLabelX = canvas.width / 1.6;
      const dateLabelY = 400;
      ctx.font = `bold ${dateLabelSize}px Arial`;
      ctx.fillText("DATE:", dateLabelX, dateLabelY);

      const dateValueSize = 20;
      const dateValueX = canvas.width / 1.2;
      const dateValueY = 400;
      ctx.font = `${dateValueSize}px Arial`;
      ctx.fillText(dateStr, dateValueX, dateValueY);

      const statusSize = 34;
      const statusX = canvas.width / 2;
      const statusY = 110;
      ctx.fillStyle = '#00ff66';
      ctx.font = `bold ${statusSize}px Arial`;
      ctx.shadowBlur = 0;
      ctx.fillText("• SYSTEM ONLINE •", statusX, statusY);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      return api.sendMessage({
        body: `╭─────────────╮\n       ✨ RDX BOT ✨\n╰─────────────╯\n\n🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${botNameNick}\n🕒 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptStr}\n🌐 𝗦𝘁𝗮𝘁𝘂𝘀: Online\n📅 𝗗𝗮𝘁𝗲: ${dateStr}\n\n📊 𝗦𝘁𝗮𝘁𝗶𝘀𝘁𝗶𝗰𝘀:\n┣ 📂 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commandsCount}\n┗ ⚡ 𝗘𝘃𝗲𝗻𝘁𝘀: ${eventsCount}\n\n━━━━━━━━━━━━━━━`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(e) {}
      }, messageID);

    } catch (error) {
      console.error("UPT2 Error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
