const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'logout',
    aliases: ['signout'],
    description: 'Logout bot from Facebook',
    usage: 'logout',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    await send.reply(`Logging out ${config.BOTNAME}...\n\nBot will be offline until restarted.`);
    
    try {
      await api.logout();
      
      const appstatePath = path.join(__dirname, '../../appstate.json');
      if (fs.existsSync(appstatePath)) {
        fs.unlinkSync(appstatePath);
      }
      
      console.log('Bot logged out successfully');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  }
};

