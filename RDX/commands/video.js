const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports = {
    config: {
        name: "video",
        version: "3.0.0",
        permission: 0,
        prefix: true,
        premium: false,
        category: "media",
        credits: "SARDAR RDX",
        description: "Download video from YouTube with high quality",
        commandCategory: "media",
        usages: ".video [video name]",
        cooldowns: 5
    },

    run: async function ({ api, event, args }) {
        const query = args.join(" ");

        if (!query) {
            return api.sendMessage("❌ Please provide a video name", event.threadID, event.messageID);
        }

        const frames = [
            "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
            "藍▰▰▱▱▱▱▱▱▱▱ 25%",
            "💜▰▰▰▰▱▱▱▱▱▱ 45%",
            "💖▰▰▰▰▰▰▱▱▱▱ 70%",
            "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
        ];

        const searchMsg = await api.sendMessage(`🔍 Searching: ${query}...\n\n${frames[0]}`, event.threadID);

        try {
            // Search using yt-search
            const searchResults = await yts(query);
            const videos = searchResults.videos;

            if (!videos || videos.length === 0) {
                api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ No results found", event.threadID, event.messageID);
            }

            const firstResult = videos[0];
            const videoUrl = firstResult.url;
            const title = firstResult.title;
            const author = firstResult.author.name;

            await api.editMessage(`🎬 Video found: ${title}\n\n${frames[1]}`, searchMsg.messageID, event.threadID);
            await api.editMessage(`🎬 Downloading...\n\n${frames[2]}`, searchMsg.messageID, event.threadID);

            // Fetch download URL using the new API
            let fetchRes;
            try {
                const apiUrl = `https://anabot.my.id/api/download/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=360&apikey=freeApikey`;
                fetchRes = await axios.get(apiUrl, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 60000
                });
            } catch (fetchError) {
                api.unsendMessage(searchMsg.messageID);
                return api.sendMessage(`❌ Failed to fetch download link: ${fetchError.message}`, event.threadID, event.messageID);
            }

            if (!fetchRes.data.success || !fetchRes.data.data.result.urls) {
                api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Failed to get download URL from server", event.threadID, event.messageID);
            }

            const downloadUrl = fetchRes.data.data.result.urls;

            await api.editMessage(`🎬 Processing file...\n\n${frames[3]}`, searchMsg.messageID, event.threadID);

            // Download the video file
            let videoRes;
            try {
                videoRes = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 180000
                });
            } catch (downloadError) {
                api.unsendMessage(searchMsg.messageID);
                return api.sendMessage(`❌ Download failed: ${downloadError.message}`, event.threadID, event.messageID);
            }

            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);

            const videoPath = path.join(cacheDir, `${Date.now()}_video.mp4`);
            fs.writeFileSync(videoPath, Buffer.from(videoRes.data));

            setTimeout(() => {
                api.editMessage(`🎬 Complete!\n\n${frames[4]}`, searchMsg.messageID, event.threadID);
            }, 500);

            await api.sendMessage(
                {
                    body: `🎬 ${title}\n📺 ${author}\n\nPowered by SARDAR RDX`,
                    attachment: fs.createReadStream(videoPath)
                },
                event.threadID
            );

            setTimeout(() => {
                try {
                    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                    api.unsendMessage(searchMsg.messageID);
                } catch (err) {
                    console.log("Cleanup error:", err);
                }
            }, 10000);

        } catch (error) {
            console.error("Video command error:", error.message);
            try { api.unsendMessage(searchMsg.messageID); } catch (e) { }
            return api.sendMessage("❌ An error occurred while processing your request", event.threadID, event.messageID);
        }
    }
};
