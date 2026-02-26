const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'gif',
    aliases: ['giphy', 'searchgif'],
    description: 'Search and send a GIF',
    usage: 'gif [search term]',
    category: 'Media',
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const query = args.join(' ');
    
    if (!query) {
      return send.reply('Please provide a search term.\n\nUsage: gif [search term]');
    }
    
    try {
      const response = await axios.get(`https://api.tenor.com/v1/search`, {
        params: {
          q: query,
          key: 'LIVDSRZULELA',
          limit: 20
        },
        timeout: 15000
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        return send.reply('No GIFs found for your search.');
      }
      
      const randomIndex = Math.floor(Math.random() * response.data.results.length);
      const gif = response.data.results[randomIndex];
      const gifUrl = gif.media[0].gif.url;
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const gifPath = path.join(cacheDir, `gif_${Date.now()}.gif`);
      
      const gifRes = await axios.get(gifUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(gifPath, Buffer.from(gifRes.data));
      
      await api.sendMessage({
        body: `GIF: ${query}`,
        attachment: fs.createReadStream(gifPath)
      }, event.threadID, event.messageID);
      
      setTimeout(() => {
        try { fs.unlinkSync(gifPath); } catch {}
      }, 10000);
      
    } catch (error) {
      return send.reply('Failed to fetch GIF: ' + error.message);
    }
  }
};

