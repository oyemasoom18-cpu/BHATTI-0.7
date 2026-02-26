const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'setgroupimage',
    aliases: ['setgroupphoto', 'groupimage', 'setgroupicon'],
    description: "Change the current group's display image.",
    usage: 'setgroupimage (reply to image)',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    const { threadID, senderID, messageReply } = event;
    
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return send.reply('Please reply to an image with this command.');
    }
    
    const attachment = messageReply.attachments[0];
    
    if (attachment.type !== 'photo') {
      return send.reply('Please reply to an image (not video, file, etc).');
    }
    
    const imageUrl = attachment.url;
    
    await send.reply('⏳ Setting group image...');
    
    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const imagePath = path.join(cacheDir, `groupimg_${Date.now()}.jpg`);
      
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      
      await api.changeGroupImage(fs.createReadStream(imagePath), threadID);
      
      setTimeout(() => {
        try {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch {}
      }, 5000);
      
      return send.reply('✅ Group image updated successfully!');
    } catch (error) {
      return send.reply('❌ Failed to set group image: ' + error.message);
    }
  }
};

