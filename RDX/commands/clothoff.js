
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'clothoff',
    aliases: ['removeclothes', 'nudify'],
    description: 'Remove clothes from photo using AI (reply to image)',
    usage: 'clothoff (reply to image)',
    category: 'Media',
    prefix: true,
    cooldowns: 15
  },
  
  async run({ api, event, send }) {
    const { threadID, messageID, messageReply } = event;
    
    // Check if user replied to a photo
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return send.reply('❌ Please reply to a photo with this command.\n\nUsage: Reply to an image and type .clothoff');
    }
    
    const attachment = messageReply.attachments[0];
    
    if (attachment.type !== 'photo') {
      return send.reply('❌ Please reply to a photo (not video, file, etc).');
    }
    
    const imageUrl = attachment.url;
    
    // Set loading reaction
    api.setMessageReaction("⏳", messageID, () => {}, true);
    
    await send.reply('🔄 Processing image... This may take 1-2 minutes.');
    
    const cacheDir = path.join(__dirname, 'cache');
    const resultPath = path.join(cacheDir, `clothoff_${Date.now()}.webp`);
    
    try {
      await fs.ensureDir(cacheDir);
      
      // Call AI API to process image
      const apiUrl = `https://api.nekoapi.vip/image-generation/pony-realism`;
      
      let apiResponse;
      try {
        apiResponse = await axios.post(apiUrl, {
          image_url: imageUrl
        }, { 
          timeout: 120000, // 2 minutes timeout
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: function (status) {
            return status < 500; // Don't throw on 4xx errors
          }
        });
      } catch (err) {
        throw new Error('❌ API server is not responding. Please try again later.');
      }
      
      if (apiResponse.status === 404) {
        throw new Error('❌ API endpoint not found. The service may be temporarily unavailable.');
      }
      
      if (apiResponse.status >= 400) {
        const errorMsg = apiResponse.data?.error || apiResponse.data?.message || 'Unknown error';
        throw new Error(`❌ API Error (${apiResponse.status}): ${errorMsg}`);
      }
      
      const resultUrl = apiResponse.data?.image_url || apiResponse.data?.result || apiResponse.data?.url || apiResponse.data?.image;
      
      if (!resultUrl) {
        let errorMsg = '❌ Processing failed. The image might have issues.';
        if (apiResponse.data?.error) {
          errorMsg += `\n\nAPI Error: ${apiResponse.data.error}`;
        } else if (apiResponse.data?.message) {
          errorMsg += `\n\nAPI Message: ${apiResponse.data.message}`;
        }
        throw new Error(errorMsg);
      }
      
      // Download result image
      await send.reply('✅ Processing complete. Downloading result...');
      
      const response = await axios.get(resultUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000 
      });
      
      fs.writeFileSync(resultPath, Buffer.from(response.data));
      
      // Check file size (25MB limit for Messenger)
      const fileSizeMB = fs.statSync(resultPath).size / 1024 / 1024;
      
      if (fileSizeMB > 25) {
        fs.unlinkSync(resultPath);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return send.reply(`⚠️ Result image size is ${fileSizeMB.toFixed(2)}MB, which exceeds the 25MB limit. Cannot send.`);
      }
      
      // Send result
      await api.sendMessage({
        body: `🖼️ CLOTHOFF RESULT
═══════════════════════
✨ AI Processing Complete
⚠️ Use responsibly
═══════════════════════`,
        attachment: fs.createReadStream(resultPath)
      }, threadID, messageID);
      
      // Set success reaction
      api.setMessageReaction("✅", messageID, () => {}, true);
      
      // Cleanup
      setTimeout(() => {
        try {
          if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        } catch {}
      }, 10000);
      
    } catch (error) {
      console.error('Clothoff command error:', error.message);
      
      api.setMessageReaction("❌", messageID, () => {}, true);
      
      let errorMsg = error.message;
      
      // If error message doesn't start with ❌, provide a generic message
      if (!errorMsg.startsWith('❌')) {
        if (errorMsg.includes('timeout')) {
          errorMsg = '❌ Request timed out. The server might be busy. Please try again later.';
        } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
          errorMsg = '❌ Cannot connect to API server. Please try again later.';
        } else if (errorMsg.includes('network')) {
          errorMsg = '❌ Network error. Please check your connection and try again.';
        } else {
          errorMsg = `❌ Error: ${errorMsg}\n\nThe API service may be temporarily unavailable. Please try again later.`;
        }
      }
      
      send.reply(errorMsg);
      
      // Cleanup on error
      try {
        if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
      } catch {}
    }
  }
};

