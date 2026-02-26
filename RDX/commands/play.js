const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports.config = {
    name: "play",
    version: "5.1.0", // updated version
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "SARDAR RDX",
    description: "Play music or video directly in chat.",
    commandCategory: "media",
    usages: ".music [song name]",
    cooldowns: 5
};

const API_BASE = "https://api.nekolabs.web.id/dwn/youtube/v1";

async function getAudioInfoAndUrl(videoUrl) {
    try {
        const response = await axios.get(API_BASE, {
            params: { url: videoUrl, format: "mp3" },
            timeout: 30000
        });

        if (response.data && response.data.success) {
            return { success: true, info: response.data.result };
        }
        return null;
    } catch (err) {
        console.log("API info fetch failed:", err.message);
        return null;
    }
}

async function downloadAudio(downloadUrl) {
    try {
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000 // longer timeout for larger files
        });
        return { success: true, data: response.data };
    } catch (err) {
        console.log("Audio file download failed:", err.message);
        return null;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const query = args.join(" ");
    
    if (!query) {
        return api.sendMessage("❌ Please provide a song name", event.threadID, event.messageID);
    }

    const frames = [
        "⌛██▒▒▒▒▒▒▒▒▒▒▒▒20%",
        "⌛█████▒▒▒▒▒▒▒▒▒ 25%",
        "⌛███████▒▒▒▒▒▒▒45%",
        "⏳██████████▒▒▒▒70%",
        "🟢██████████████100% 😍"
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

        await api.editMessage(`🎵 Found: ${firstResult.title}\n\n${frames[1]}`, searchMsg.messageID, event.threadID);

        const apiResult = await getAudioInfoAndUrl(videoUrl);
        
        if (!apiResult || !apiResult.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ API is busy or video not supported. Try again later.", event.threadID, event.messageID);
        }

        const { title, cover, downloadUrl } = apiResult.info;
        const author = firstResult.author.name; // fallback from search

        await api.editMessage(`🎵 Downloading audio...\n\n${frames[2]}`, searchMsg.messageID, event.threadID);

        const downloadResult = await downloadAudio(downloadUrl);
        
        if (!downloadResult || !downloadResult.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Failed to download audio file. Try again later.", event.threadID, event.messageID);
        }

        await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, searchMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
        fs.writeFileSync(audioPath, Buffer.from(downloadResult.data));

        await api.editMessage(`🎵 Complete!\n\n${frames[4]}`, searchMsg.messageID, event.threadID);

        let thumbPath = null;
        if (cover) {
            try {
                const thumbRes = await axios.get(cover, { responseType: 'arraybuffer', timeout: 10000 });
                thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
            } catch (thumbError) {
                console.log("Thumbnail download failed:", thumbError.message);
            }
        }

        // Send thumbnail with info (if available)
        if (thumbPath && fs.existsSync(thumbPath)) {
            await api.sendMessage(
                {
                    body: `🎵 ${title}\n📺 ${author}`,
                    attachment: fs.createReadStream(thumbPath)
                },
                event.threadID
            );
        } else {
            // Fallback text message if no thumbnail
            await api.sendMessage(`🎵 ${title}\n📺 ${author}`, event.threadID);
        }

        // Send audio file
        await api.sendMessage(
            {
                body: `🎵 Here is your audio file`,
                attachment: fs.createReadStream(audioPath)
            },
            event.threadID
        );

        // Cleanup after 10 seconds
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
