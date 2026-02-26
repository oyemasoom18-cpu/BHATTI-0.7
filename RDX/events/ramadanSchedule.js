const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');
const logs = require('../../Data/utility/logs');

const axios = require('axios');

module.exports = {
    config: {
        name: "ramadanSchedule",
        description: "Automated Ramadan Sehri and Iftar notifications",
        eventType: ["onload"],
        credits: "SARDAR RDX"
    },

    async run({ api }) {
        if (!api) return;

        const dataPath = path.join(__dirname, '../../Data/config/ramzan_data.json');
        if (!fs.existsSync(dataPath)) {
            return logs.error('RAMADAN_SCHEDULE', 'Schedule data file not found!');
        }

        // Schedule check every minute
        cron.schedule('* * * * *', async () => {
            try {
                const ramzanData = fs.readJsonSync(dataPath);
                const now = moment().tz('Asia/Karachi');
                const currentTime = now.format('HH:mm');
                const todayDate = now.format('DD MMM YYYY');

                const todaySchedules = ramzanData.schedule.filter(s => s.date === todayDate);
                if (todaySchedules.length === 0) return;

                for (const todaySchedule of todaySchedules) {
                    if (currentTime === todaySchedule.sehri) {
                        await this.sendRamadanAlert(api, 'sehri', todaySchedule, ramzanData);
                    } else if (currentTime === todaySchedule.iftar) {
                        await this.sendRamadanAlert(api, 'iftar', todaySchedule, ramzanData);
                    }
                }
            } catch (error) {
                logs.error('RAMADAN_SCHEDULE', error.message);
            }
        }, {
            timezone: "Asia/Karachi"
        });

        logs.success('RAMADAN_SCHEDULE', 'Ramadan automated notifications started!');
    },

    async sendRamadanAlert(api, type, todaySchedule, ramzanData) {
        try {
            const threads = require('../../Data/system/database/models/threads').getAll();
            const approvedThreads = threads.filter(t => t.banned !== 1);

            if (approvedThreads.length === 0) return;

            const verseCategory = type === 'sehri' ? 'ramzan' : (Math.random() > 0.5 ? 'shirk' : 'taqwa');
            const randomVerse = ramzanData.verses[verseCategory][Math.floor(Math.random() * ramzanData.verses[verseCategory].length)];

            const title = type === 'sehri' ? '🌙 𝐒𝐄𝐇𝐑𝐈 𝐓𝐈𝐌𝐄 𝐄𝐍𝐃𝐒!' : '🌇 𝐈𝐅𝐓𝐀𝐑 𝐓𝐈𝐌𝐄 𝐒𝐓𝐀𝐑𝐓𝐒!';
            const timeLabel = type === 'sehri' ? 'Sehri Bnd hone ka waqt' : 'Iftar hone ka waqt';

            const message = `${title}\n\n` +
                `📅 **Date:** ${todaySchedule.date}\n` +
                `🕌 **Ramzan:** ${todaySchedule.day}\n` +
                `⏰ **${timeLabel}:** ${type === 'sehri' ? todaySchedule.sehri : todaySchedule.iftar}\n\n` +
                `📖 **Ayat of the day:**\n${randomVerse}\n\n` +
                `🕌 **Developed by SARDAR RDX**`.trim();

            const randomPic = ramzanData.images[Math.floor(Math.random() * ramzanData.images.length)];
            const cacheDir = path.join(__dirname, '../commands/cache');
            fs.ensureDirSync(cacheDir);
            const imgPath = path.join(cacheDir, `ramadan_${Date.now()}.jpg`);

            let downloaded = false;
            try {
                const response = await axios.get(randomPic, { responseType: 'arraybuffer', timeout: 10000 });
                fs.writeFileSync(imgPath, Buffer.from(response.data));
                downloaded = true;
            } catch (e) {
                logs.error('RAMADAN_IMAGE', `Failed to download image: ${e.message}`);
            }

            logs.info('RAMADAN_SCHEDULE', `Sending ${type} alert to ${approvedThreads.length} groups...`);

            for (const thread of approvedThreads) {
                try {
                    if (downloaded && fs.existsSync(imgPath)) {
                        await api.sendMessage({
                            body: message,
                            attachment: fs.createReadStream(imgPath)
                        }, thread.id);
                    } else {
                        await api.sendMessage(message, thread.id);
                    }
                    // 1 second delay between messages as requested
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (e) {
                    logs.error('RAMADAN_SCHEDULE', `Failed to send to ${thread.id}: ${e.message}`);
                }
            }

            if (downloaded && fs.existsSync(imgPath)) {
                try { fs.unlinkSync(imgPath); } catch (e) { }
            }

            logs.success('RAMADAN_SCHEDULE', `Sent ${type} alert to ${approvedThreads.length} groups.`);
        } catch (error) {
            logs.error('RAMADAN_SCHEDULE_SEND', error.message);
        }
    }
};
