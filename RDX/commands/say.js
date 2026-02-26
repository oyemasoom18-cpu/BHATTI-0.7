const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'say',
    aliases: ['tts', 'speak', 'voice'],
    description: "Make the bot say something in voice.",
    usage: 'say [message or reply to message]',
    category: 'Media',
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const { messageReply } = event;
    
    let text = args.join(' ');
    
    if (!text && messageReply) {
      text = messageReply.body;
    }
    
    if (!text) {
      return send.reply('Please provide text or reply to a message.\n\nUsage: say [text]');
    }
    
    if (text.length > 500) {
      return send.reply('Text too long. Maximum 500 characters.');
    }
    
    await send.reply('Converting to voice...');
    
    try {
      const encodedText = encodeURIComponent(text);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ur&client=tw-ob`;
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const audioPath = path.join(cacheDir, `tts_${Date.now()}.mp3`);
      
      const response = await axios.get(ttsUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });
      
      fs.writeFileSync(audioPath, Buffer.from(response.data));
      
      await api.sendMessage({
        body: `Voice Message`,
        attachment: fs.createReadStream(audioPath)
      }, event.threadID, event.messageID);
      
      setTimeout(() => {
        try { fs.unlinkSync(audioPath); } catch {}
      }, 15000);
      
    } catch (error) {
      try {
        const encodedText = encodeURIComponent(text);
        const backupUrl = `https://api.voicerss.org/?key=30e7c6148e01490c91d5b93e4d39c65b&hl=ur-pk&src=${encodedText}&c=MP3`;
        
        const cacheDir = path.join(__dirname, 'cache');
        const audioPath = path.join(cacheDir, `tts_${Date.now()}.mp3`);
        
        const response = await axios.get(backupUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        fs.writeFileSync(audioPath, Buffer.from(response.data));
        
        await api.sendMessage({
          body: `Voice Message`,
          attachment: fs.createReadStream(audioPath)
        }, event.threadID, event.messageID);
        
        setTimeout(() => {
          try { fs.unlinkSync(audioPath); } catch {}
        }, 15000);
        
      } catch (err) {
        return send.reply('Failed to convert text to speech: ' + err.message);
      }
    }
  }
};

