const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const axios = require('axios');

module.exports = {
    config: {
        name: "ramzan",
        aliases: ["ramadan", "ramzanschedule"],
        description: "Sehri and Iftar timings and Ramadan info.",
        usage: "ramzan [all]",
        category: "Islamic",
        credits: "SARDAR RDX",
        prefix: true
    },

    async run({ api, event, args, send, config }) {
        const { threadID, messageID, senderID } = event;
        const dataPath = path.join(__dirname, '../../Data/config/ramzan_data.json');

        if (!fs.existsSync(dataPath)) {
            return send.reply("❌ Ramadan schedule data not found!");
        }

        const ramzanData = fs.readJsonSync(dataPath);
        const today = moment().tz('Asia/Karachi').format('DD MMM YYYY');
        const todaySchedules = ramzanData.schedule.filter(s => s.date === today);

        if (args[0] === 'all') {
            let fullSchedule = "🕌 **𝐑𝐀𝐌𝐀𝐃𝐀𝐍 𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄 𝟐𝟎𝟐𝟔** 🕌\n\n";
            fullSchedule += "𝐑𝐚𝐦𝐳𝐚𝐧 — 𝐃𝐚𝐭𝐞 — 𝐒𝐞𝐡𝐫𝐢 — 𝐈𝐟𝐭𝐚𝐫\n";
            fullSchedule += "──────────────────\n";

            ramzanData.schedule.forEach(s => {
                fullSchedule += `🌙 ${s.day} — ${s.date.split(' ')[0]} ${s.date.split(' ')[1]} — ${s.sehri} — ${s.iftar}\n`;
            });

            fullSchedule += "\n──────────────────\n";
            fullSchedule += "Developed by: **SARDAR RDX**";

            return send.reply(fullSchedule);
        }

        // Default: Today's Timing
        let msg = "🌙 **𝐑𝐀𝐌𝐀𝐃𝐀𝐍 𝐓𝐎𝐃𝐀𝐘'𝐒 𝐓𝐈𝐌𝐈𝐍𝐆** 🌙\n\n";
        msg += `📍 **Date:** ${today}\n`;

        if (todaySchedules.length > 0) {
            todaySchedules.forEach(todaySchedule => {
                msg += `🕋 **Ramzan:** ${todaySchedule.day}\n`;
                msg += `🌅 **Sehri Ends:** ${todaySchedule.sehri} AM\n`;
                msg += `🌇 **Iftar Starts:** (approx) ${todaySchedule.iftar}\n\n`;
            });
        } else {
            msg += "ℹ️ Aaj ka koi schedule majood nahi hy.\n";
            msg += "💡 Full schedule dekhnay ke liye `.ramzan all` type krein.";
        }

        msg += "──────────────────\n";
        msg += "Developed by: **SARDAR RDX**";

        const randomPic = ramzanData.images[Math.floor(Math.random() * ramzanData.images.length)];
        const cacheDir = path.join(__dirname, 'cache');
        fs.ensureDirSync(cacheDir);
        const imgPath = path.join(cacheDir, `ramzan_${Date.now()}.jpg`);

        try {
            const response = await axios.get(randomPic, { responseType: 'arraybuffer', timeout: 10000 });
            fs.writeFileSync(imgPath, Buffer.from(response.data));

            return api.sendMessage({
                body: msg,
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => {
                try { fs.unlinkSync(imgPath); } catch (e) { }
            }, messageID);
        } catch (e) {
            return send.reply(msg);
        }
    }
};
