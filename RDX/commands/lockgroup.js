const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'lockgroup',
    aliases: ['lock', 'lockgc'],
    description: "Lock group name, image, or settings.",
    usage: 'lockgroup [name/emoji/theme/image/all] [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can lock group settings.');
    }
    
    const settings = Threads.getSettings(threadID);
    const target = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();
    
    if (!target) {
      return send.reply(`LOCK SETTINGS
═══════════════════════
Name Lock: ${settings.lockName ? 'ON' : 'OFF'}
Emoji Lock: ${settings.lockEmoji ? 'ON' : 'OFF'}
Theme Lock: ${settings.lockTheme ? 'ON' : 'OFF'}
Image Lock: ${settings.lockImage ? 'ON' : 'OFF'}
═══════════════════════
Usage: lockgroup [name/emoji/theme/image/all] [on/off]

Example:
- lockgroup all on
- lockgroup theme on
- lockgroup image off`);
    }
    
    const enable = action === 'on' || action === 'enable' || action === 'true';
    
    if (target === 'name') {
      Threads.setSettings(threadID, { 
        lockName: enable,
        originalName: enable ? threadInfo.threadName : null
      });
      return send.reply(`Name Lock: ${enable ? 'ENABLED' : 'DISABLED'}${enable ? '\n\nOriginal Name: ' + threadInfo.threadName : ''}`);
    }
    
    if (target === 'emoji') {
      Threads.setSettings(threadID, { 
        lockEmoji: enable,
        originalEmoji: enable ? threadInfo.emoji : null
      });
      return send.reply(`Emoji Lock: ${enable ? 'ENABLED' : 'DISABLED'}${enable ? '\n\nOriginal Emoji: ' + threadInfo.emoji : ''}`);
    }
    
    if (target === 'theme' || target === 'color') {
      const currentTheme = threadInfo.color || threadInfo.threadThemeID || null;
      Threads.setSettings(threadID, { 
        lockTheme: enable,
        originalTheme: enable ? currentTheme : null
      });
      return send.reply(`Theme Lock: ${enable ? 'ENABLED' : 'DISABLED'}${enable ? '\n\nTheme ID saved.' : ''}`);
    }
    
    if (target === 'image' || target === 'photo' || target === 'pic') {
      if (enable) {
        const imageUrl = threadInfo.imageSrc;
        if (imageUrl) {
          try {
            const cacheDir = path.join(__dirname, './cache/data/lockgroup');
            fs.ensureDirSync(cacheDir);
            
            const imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(response.data));
            
            Threads.setSettings(threadID, { 
              lockImage: true,
              originalImagePath: imagePath
            });
            return send.reply('Image Lock: ENABLED\n\nGroup image saved and will be restored if changed.');
          } catch (err) {
            return send.reply('Failed to save group image: ' + err.message);
          }
        } else {
          return send.reply('No group image found to lock.');
        }
      } else {
        Threads.setSettings(threadID, { 
          lockImage: false,
          originalImagePath: null
        });
        return send.reply('Image Lock: DISABLED');
      }
    }
    
    if (target === 'all') {
      let imagePath = null;
      
      if (enable && threadInfo.imageSrc) {
        try {
          const cacheDir = path.join(__dirname, './cache/data/lockgroup');
          fs.ensureDirSync(cacheDir);
          
          imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
          const response = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
          fs.writeFileSync(imagePath, Buffer.from(response.data));
        } catch {}
      }
      
      const currentTheme = threadInfo.color || threadInfo.threadThemeID || null;
      
      Threads.setSettings(threadID, { 
        lockName: enable,
        lockEmoji: enable,
        lockTheme: enable,
        lockImage: enable,
        originalName: enable ? threadInfo.threadName : null,
        originalEmoji: enable ? threadInfo.emoji : null,
        originalTheme: enable ? currentTheme : null,
        originalImagePath: enable ? imagePath : null
      });
      
      return send.reply(`ALL LOCKS: ${enable ? 'ENABLED' : 'DISABLED'}
═══════════════════════
Name Lock: ${enable ? 'ON' : 'OFF'}
Emoji Lock: ${enable ? 'ON' : 'OFF'}
Theme Lock: ${enable ? 'ON' : 'OFF'}
Image Lock: ${enable ? 'ON' : 'OFF'}
═══════════════════════
${enable ? 'All original settings saved and will be restored if changed.' : ''}`);
    }
    
    return send.reply('Usage: lockgroup [name/emoji/theme/image/all] [on/off]');
  }
};

