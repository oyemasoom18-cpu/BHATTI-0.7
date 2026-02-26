const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'cover',
    aliases: ['coverphoto', 'createcover'],
    description: 'Create a cover photo',
    usage: 'cover [name] | [subname] | [color]',
    category: 'Media',
    prefix: true
  },
  
  async run({ api, event, args, send, Users }) {
    const { senderID } = event;
    
    const input = args.join(' ');
    
    if (!input) {
      return send.reply(`Please provide name and optional subname/color.

Usage: cover [name] | [subname] | [color]

Example:
- cover SARDAR RDX
- cover SARDAR RDX | Official Bot | blue
- cover My Name | Subtitle | red`);
    }
    
    const parts = input.split('|').map(s => s.trim());
    let name = parts[0] || 'SARDAR RDX';
    let subname = parts[1] || 'Bot Official';
    let color = parts[2]?.toLowerCase() || 'blue';
    
    const colors = {
      'blue': '0066cc',
      'red': 'cc0000',
      'green': '00cc00',
      'purple': '6600cc',
      'pink': 'cc0066',
      'orange': 'cc6600',
      'black': '333333',
      'white': 'ffffff'
    };
    
    const hexColor = colors[color] || colors['blue'];
    
    await send.reply('Creating cover photo...');
    
    try {
      const apiUrl = `https://api-canvass.vercel.app/cover?name=${encodeURIComponent(name)}&subname=${encodeURIComponent(subname)}&uid=${senderID}&color=${hexColor}`;
      
      const response = await axios.get(apiUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const coverPath = path.join(cacheDir, `cover_${Date.now()}.jpg`);
      fs.writeFileSync(coverPath, Buffer.from(response.data));
      
      await api.sendMessage({
        body: `COVER PHOTO CREATED
═══════════════════════
Name: ${name}
Subname: ${subname}
Color: ${color}
═══════════════════════`,
        attachment: fs.createReadStream(coverPath)
      }, event.threadID, event.messageID);
      
      setTimeout(() => {
        try { fs.unlinkSync(coverPath); } catch {}
      }, 15000);
      
    } catch (error) {
      const fallbackMsg = `COVER DESIGN
═══════════════════════════════════════════
        
        ${name.toUpperCase()}
        
        ${subname}
        
═══════════════════════════════════════════
Color Theme: ${color}`;
      
      return send.reply(fallbackMsg);
    }
  }
};

