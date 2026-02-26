const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "music",
    version: "5.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "SARDAR RDX",
    description: "Play or download music from various sources.",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

const API_KEY = "apim_G6ylMLe5k_EesOTJHWi4-VvBxsdVGn3Re1j1UbBQ2xA";

async function downloadAudio(videoUrl) {
    try {
        const response = await axios.post("https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download", {
            url: videoUrl,
            format: "mp3"
        }, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 60000
        });
        
        if (response.data && response.data.downloadUrl) {
            const audioData = await axios.get(response.data.downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return { success: true, data: audioData.data };
        }
        return null;
    } catch (err) {
        console.log("Audio download failed:", err.response?.data || err.message);
        return null;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const query = args.join(" ");
    
    if (!query) {
        return api.sendMessage("❌ Please provide a song name", event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🔍 Searching: ${query}\n\n${frames[0]}`, event.threadID);

    try {
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
        const thumbnail = firstResult.thumbnail;

        await api.editMessage(`🎵 Found: ${title}\n\n${frames[1]}`, searchMsg.messageID, event.threadID);
        await api.editMessage(`🎵 Downloading...\n\n${frames[2]}`, searchMsg.messageID, event.threadID);

        const downloadResult = await downloadAudio(videoUrl);
        
        if (!downloadResult || !downloadResult.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Download server is busy. Please try again later.", event.threadID, event.messageID);
        }

        await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, searchMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
        fs.writeFileSync(audioPath, Buffer.from(downloadResult.data));

        await api.editMessage(`🎵 Complete!\n\n${frames[4]}`, searchMsg.messageID, event.threadID);

        let thumbPath = null;
        if (thumbnail) {
            try {
                const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
            } catch (thumbError) {
                console.log("Thumbnail download failed:", thumbError.message);
            }
        }

        if (thumbPath && fs.existsSync(thumbPath)) {
            await api.sendMessage(
                {
                    body: `🎵 ${title}\n📺 ${author}`,
                    attachment: fs.createReadStream(thumbPath)
                },
                event.threadID
            );
        }

        await api.sendMessage(
            {
                body: `🎵 Audio File`,
                attachment: fs.createReadStream(audioPath)
            },
            event.threadID
        );

        setTimeout(() => {
            try {
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
                api.unsendMessage(searchMsg.messageID);
            } catch (err) {
                console.log("Cleanup error:", err);
            }
        }, 10000);

    } catch (error) {
        console.error("Music command error:", error.message);
        try { api.unsendMessage(searchMsg.messageID); } catch(e) {}
        return api.sendMessage("❌ An error occurred. Please try again.", event.threadID, event.messageID);
    }
};

