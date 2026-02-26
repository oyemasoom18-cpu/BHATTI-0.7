const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'setprofile',
    aliases: ['setavatar', 'setpfp', 'setdp'],
    description: 'Change bot profile picture (reply to image)',
    usage: 'setprofile (reply to image)',
    category: 'Profile',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    const { senderID, messageReply } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return send.reply('Please reply to an image with this command.');
    }
    
    const attachment = messageReply.attachments[0];
    
    if (attachment.type !== 'photo') {
      return send.reply('Please reply to an image (not video, file, etc).');
    }
    
    let imageUrl = attachment.url || attachment.largePreviewUrl || attachment.previewUrl;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return send.reply('Could not get image URL. Please try with a different image.');
    }
    
    await send.reply('Setting profile picture...');
    
    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const imagePath = path.join(cacheDir, `profile_${Date.now()}.jpg`);
      
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      fs.writeFileSync(imagePath, Buffer.from(response.data));
      
      if (!api.changeAvatar) {
        try { fs.unlinkSync(imagePath); } catch {}
        return send.reply('Profile picture change is not supported by this API version.');
      }
      
      return new Promise((resolve) => {
        api.changeAvatar(fs.createReadStream(imagePath), (err) => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {}
          
          if (err) {
            console.error('[SETPROFILE] changeAvatar error:', err);
            send.reply('Failed to change profile picture. Facebook may have blocked this action.').then(resolve);
          } else {
            send.reply('Profile picture updated successfully!').then(resolve);
          }
        });
      });
      
    } catch (error) {
      console.error('[SETPROFILE] Error:', error);
      return send.reply('Failed to change profile picture: ' + error.message);
    }
  }
};

