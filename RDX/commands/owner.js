const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'owner',
    aliases: ['dev', 'creator', 'developer'],
    description: 'Show bot owner information',
    credits: "SARDAR RDX",
    usage: 'owner',
    category: 'Info',
    prefix: false
  },

  async run({ api, event, send, config, Users }) {
    const { threadID, messageID } = event;

    const ownerPics = [
      'https://i.ibb.co/6ckwbv4V/06291e1dc09d.jpg'
    ];

    const randomPic = ownerPics[0];

    const ownerInfo = `
╔═══════════════════╗
║   ✨ 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎 ✨   
╠═══════════════════╣̍̍͆͆͆͆͆͆
║                           
║  👤 𝐍𝐚𝐦𝐞: SARDAR RDX    
║                           
╠═══════════════════╣̥̥̥̥̥̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊
║  📱 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 𝐈𝐧𝐟𝐨:          
║                           
║  🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:              
║  facebook.com/SARDAR RDX 
║                           
║  📲 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩:              
║  wa.me/923301068874       
║                           
╠═══════════════════╣̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̬̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊̊
║  🤖 𝐁𝐨𝐭 𝐃𝐞𝐭𝐚𝐢𝐥𝐬:           
║                           
║  📛 Name: ${config.BOTNAME || 'SARDAR RDX'}
║  ⚡ Prefix: ${config.PREFIX || '.'}
║  💻 Version: 1.0      
║  🛠️ Framework: RDX-FCA    
║                           
╠═══════════════════╣̻̻̻̻̻̻̻̻̻̻̻
║  💝 𝙏𝙝𝙖𝙣𝙠 𝙮𝙤𝙪 𝙛𝙤𝙧 𝙪𝙨𝙞𝙣𝙜!  
╚═══════════════════╝
    `.trim();

    try {
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `owner_${Date.now()}.jpg`);

      const response = await axios.get(randomPic, { responseType: 'arraybuffer' });
      fs.writeFileSync(imgPath, Buffer.from(response.data));

      // First message: IBB picture with ownerInfo (original style)
      await api.sendMessage(
        {
          body: ownerInfo,
          attachment: fs.createReadStream(imgPath)
        },
        threadID
      );

      try { fs.unlinkSync(imgPath); } catch {}

      // Second message: Share owner profile (contact share)
      const adminID = config.ADMINBOT && config.ADMINBOT[0] ? config.ADMINBOT[0] : config.OWNER_ID;
      const contactMsg = "╭─────────────╮\n   👑 BOT OWNER 👑 \n╰─────────────╯\n\nYe bot ke owner ki profile hai:";
      return api.shareContact(contactMsg, adminID, threadID);

    } catch (error) {
      console.error(error);
      return send.reply(ownerInfo);
    }
  }
};
