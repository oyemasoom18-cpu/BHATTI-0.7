const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'OFF_autoYoutube',
        eventType: 'message',
        description: 'Auto detect and download YouTube videos from links'
    },

    async run({ api, event }) {
        const { threadID, body, messageID, senderID } = event;

        if (!body) return;

        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/gi;
        const matches = body.match(youtubeRegex);

        if (!matches || matches.length === 0) return;

        const youtubeUrl = matches[0];
        const API_BASE = "https://yt-tt.onrender.com";

        const frames = [
            "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
            "💙▰▰▱▱▱▱▱▱▱▱ 25%",
            "💜▰▰▰▰▱▱▱▱▱▱ 45%",
            "💖▰▰▰▰▰▰▱▱▱▱ 70%",
            "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
        ];

        let statusMsg;
        try {
            statusMsg = await api.sendMessage(`🎬 YouTube Detected!\n\n${frames[0]}`, threadID);
        } catch (e) {
            return;
        }

        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    await api.editMessage(`🎬 Retry ${attempt}/${maxRetries}...\n\n${frames[1]}`, statusMsg.messageID, threadID);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    await api.editMessage(`🎬 Downloading YouTube video...\n\n${frames[2]}`, statusMsg.messageID, threadID);
                }

                const response = await axios.get(`${API_BASE}/api/youtube/video`, {
                    params: { url: youtubeUrl },
                    timeout: 150000,
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.data || response.data.length < 1000) {
                    throw new Error("Empty or invalid response");
                }

                await api.editMessage(`🎬 Processing...\n\n${frames[3]}`, statusMsg.messageID, threadID);

                const cacheDir = path.join(__dirname, "../commands/cache");
                await fs.ensureDir(cacheDir);

                const videoPath = path.join(cacheDir, `${Date.now()}_auto_youtube.mp4`);
                fs.writeFileSync(videoPath, Buffer.from(response.data));

                const stats = fs.statSync(videoPath);
                if (stats.size < 1000) {
                    fs.unlinkSync(videoPath);
                    throw new Error("Downloaded file too small");
                }

                await api.editMessage(`🎬 Complete!\n\n${frames[4]}`, statusMsg.messageID, threadID);

                await api.sendMessage(
                    {
                        body: `🎬 YouTube Video`,
                        attachment: fs.createReadStream(videoPath)
                    },
                    threadID
                );

                setTimeout(() => {
                    try {
                        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        api.unsendMessage(statusMsg.messageID);
                    } catch (err) { }
                }, 20000);

                return;

            } catch (error) {
                lastError = error;
                console.log(`Auto YouTube attempt ${attempt} failed:`, error.message);

                if (attempt === maxRetries) {
                    try {
                        await api.editMessage(`❌ YouTube download failed after ${maxRetries} attempts`, statusMsg.messageID, threadID);
                        setTimeout(() => {
                            try { api.unsendMessage(statusMsg.messageID); } catch (e) { }
                        }, 5000);
                    } catch (e) { }
                }
            }
        }
    }
};

