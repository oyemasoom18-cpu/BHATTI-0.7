const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'prefix',
    aliases: ['px', 'botprefix'],
    description: "Check or change the bot prefix.",
    credits: "SARDAR RDX",
    usage: 'prefix',
    category: 'Utility',
    prefix: false
  },
  
  async run({ api, event, send, config, client, Users }) {
    const { threadID, messageID, senderID } = event;
    
    try {
      const uniqueCommands = new Set();
      if (client && client.commands) {
        client.commands.forEach((cmd, key) => {
          if (cmd.config && cmd.config.name) {
            uniqueCommands.add(cmd.config.name.toLowerCase());
          }
        });
      }
      const commandCount = uniqueCommands.size || 141;
      
      const now = moment().tz('Asia/Karachi');
      const time = now.format('hh:mm:ss A');
      const date = now.format('DD/MM/YYYY');
      
      const startTime = global.startTime || Date.now();
      const uptime = Date.now() - startTime;
      const hours = Math.floor(uptime / 3600000);
      const minutes = Math.floor((uptime % 3600000) / 60000);
      const seconds = Math.floor((uptime % 60000) / 1000);
      
      let latestCommand = 'N/A';
      try {
        const commandsPath = path.join(__dirname, '.');
        const files = fs.readdirSync(commandsPath)
          .filter(f => f.endsWith('.js'))
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(commandsPath, f)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);
        if (files.length > 0) {
          latestCommand = files[0].name;
        }
      } catch (e) {}
      
      let senderName = 'User';
      try {
        if (Users && Users.getNameUser) {
          senderName = await Users.getNameUser(senderID);
        }
      } catch (e) {}
      
      // Get admin info
      const adminID = config.ADMINBOT && config.ADMINBOT[0] ? config.ADMINBOT[0] : config.OWNER_ID;
      let adminName = 'Bot Owner';
      try {
        if (Users && Users.getNameUser) {
          adminName = await Users.getNameUser(adminID);
        }
      } catch (e) {}
      
      const cardMessage = `┏━━━━━━━━━━━━━━━━━━━┓̩̩̩̩̩̩̩̩
┃    🤖 BOT INFO 🤖        
┗━━━━━━━━━━━━━━━━━━━┛

👋 Hi ${senderName}!

🔧 Bot: ${config.BOTNAME || 'SARDAR RDX'}
📌 Prefix: ${config.PREFIX}
📊 Commands: ${commandCount}
⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
📁 Latest: ${latestCommand}

🕐 Time: ${time}
📅 Date: ${date}

Type ${config.PREFIX}help for commands!

👑 Bot Owner:`;

      return api.shareContact(cardMessage, adminID, threadID);

    } catch (error) {
      console.error('Error in prefix command:', error.message);
      return api.sendMessage(
        `❌ Error: ${error.message}`,
        threadID,
        messageID
      );
    }
  }
};

