const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'clearcache',
    aliases: ['cc', 'cache'],
    description: 'Clear cache folder (images, audio, video files)',
    usage: 'clearcache',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const cacheDir = path.join(__dirname, 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      return send.reply('Cache folder does not exist or is already empty.');
    }
    
    try {
      const files = fs.readdirSync(cacheDir);
      
      if (files.length === 0) {
        return send.reply('Cache folder is already empty.');
      }
      
      const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.mpeg', '.webp', '.wav', '.ogg'];
      
      let deleted = 0;
      let totalSize = 0;
      let skipped = 0;
      
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const ext = path.extname(file).toLowerCase();
        
        if (mediaExtensions.includes(ext)) {
          try {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
            fs.unlinkSync(filePath);
            deleted++;
          } catch {
            skipped++;
          }
        } else {
          skipped++;
        }
      }
      
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return send.reply(`CACHE CLEARED
═══════════════════════
Deleted: ${deleted} files
Skipped: ${skipped} files
Freed: ${sizeMB} MB
═══════════════════════`);
      
    } catch (error) {
      return send.reply('Failed to clear cache: ' + error.message);
    }
  }
};

