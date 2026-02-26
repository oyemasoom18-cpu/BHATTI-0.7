const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'avatar',
    aliases: ['avt', 'profilepic', 'dp'],
    description: "Create custom avatars and profile pictures.",
    usage: 'avatar [mention/reply/uid]',
    category: 'Media',
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const { senderID, mentions } = event;
    
    let uid = senderID;
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    }
    
    try {
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      const avatarPath = path.join(cacheDir, `avatar_${uid}_${Date.now()}.jpg`);
      
      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(avatarPath, Buffer.from(response.data));
      
      await api.sendMessage({
        body: `PROFILE PICTURE
═══════════════════════
Name: ${name}
UID: ${uid}
═══════════════════════`,
        attachment: fs.createReadStream(avatarPath)
      }, event.threadID, event.messageID);
      
      setTimeout(() => {
        try { fs.unlinkSync(avatarPath); } catch {}
      }, 10000);
      
    } catch (error) {
      return send.reply('Failed to get profile picture: ' + error.message);
    }
  }
};

