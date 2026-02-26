const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'autoDownloader',
        eventType: 'message',
        credits: 'SARDAR RDX',
        description: 'Auto detect and download videos from links (FB, IG, TT, YT)',
    },

    async run({ api, event }) {
        const { threadID, body, messageID, senderID } = event;
        if (!body || senderID === api.getCurrentUserID()) return;

        // Combined Regex for popular platforms
        const urlRegex = /https?:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|facebook\.com|fb\.watch|instagram\.com|youtube\.com|youtu\.be)\/[^\s]+/gi;
        const matches = body.match(urlRegex);

        if (!matches || matches.length === 0) return;

        const url = matches[0];
        const frames = ["⏳ Detecting...", "📥 Fetching...", "🚀 Downloading...", "🎬 Processing...", "✅ Sent!"];

        let statusMsg;
        try {
            statusMsg = await api.sendMessage(`🌀 **AUTO DETECT**\n\n${frames[0]}`, threadID);
        } catch (e) { return; }

        try {
            // Step 1: Detect Platform & Get Link from AIO API
            const apiUrl = `https://anabot.my.id/api/download/aio?url=${encodeURIComponent(url)}&apikey=freeApikey`;

            await api.editMessage(`🌀 **AUTO DETECT**\n\n${frames[1]}`, statusMsg.messageID);
            const response = await axios.get(apiUrl, { timeout: 60000 });
            const result = response.data;

            if (!result.success || !result.data || !result.data.result) {
                throw new Error("Invalid response from API");
            }

            const data = result.data.result;
            if (!data || !data.links) throw new Error("No download links available in response");

            const videoLink = (data.links.find(l => l && l.type === 'mp4' && !l.mute) || data.links[0])?.url;

            if (!videoLink) throw new Error("No download link found");

            await api.editMessage(`🌀 **AUTO DETECT**\n\n${frames[2]}`, statusMsg.messageID);

            // Step 2: Download to Cache
            const cacheDir = path.join(__dirname, "../commands/cache");
            await fs.ensureDir(cacheDir);
            const filePath = path.join(cacheDir, `auto_rdx_${Date.now()}.mp4`);

            const fileRes = await axios({
                method: 'get',
                url: videoLink,
                responseType: 'arraybuffer',
                timeout: 180000
            });

            await api.editMessage(`🌀 **AUTO DETECT**\n\n${frames[3]}`, statusMsg.messageID);
            fs.writeFileSync(filePath, Buffer.from(fileRes.data));

            // Step 3: Send & Cleanup
            await api.editMessage(`🌀 **AUTO DETECT**\n\n${frames[4]}`, statusMsg.messageID);

            await api.sendMessage({
                body: `✅ **Auto Downloaded**\n📝 **Title:** ${data.title || 'Video'}\n🌐 **Source:** ${data.source || 'Social Media'}\n\n👑 **SARDAR RDX**`,
                attachment: fs.createReadStream(filePath)
            }, threadID);

            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    api.unsendMessage(statusMsg.messageID);
                } catch (e) { }
            }, 10000);

        } catch (error) {
            console.error("AutoDownloader Error:", error.message);
            try {
                await api.editMessage(`❌ Auto detection failed: ${error.message}`, statusMsg.messageID);
                setTimeout(() => api.unsendMessage(statusMsg.messageID), 5000);
            } catch (e) { }
        }
    }
};
