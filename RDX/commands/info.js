const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'info',
    aliases: ['botinfo', 'stats', 'status'],
    description: "View bot information and statistics",
    credits: "SARDAR RDX",
    usage: 'info',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, args, send, client, config }) {
    const { threadID, senderID, messageID } = event;
    
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const time = moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY');

    let commandCount = 0;
    try {
      const uniqueCommands = new Set();
      client.commands.forEach((cmd) => {
        if (cmd.config && cmd.config.name) uniqueCommands.add(cmd.config.name.toLowerCase());
      });
      commandCount = uniqueCommands.size;
    } catch (e) { }

    let latestFile = 'None';
    try {
      const commandsFolder = path.join(__dirname, '../commands');
      const files = fs.readdirSync(commandsFolder);
      const allFiles = files.filter(file => file.endsWith('.js')).map(file => ({
        name: file,
        time: fs.statSync(path.join(commandsFolder, file)).mtime.getTime()
      }));
      if (allFiles.length > 0) latestFile = allFiles.sort((a, b) => b.time - a.time)[0].name;
    } catch (e) { }

    const userName = await api.getUserInfo(senderID) 
      ? (await api.getUserInfo(senderID))[senderID]?.name 
      : 'User';

    const message = `╭─────────────────╮
│  ${config.BOTNAME || 'SARDAR RDX'}  
├─────────────────┤
│ 📅 ${time}
│ 👤 ${userName}
│ 📊 Commands: ${commandCount}
│ 🔧 Prefix: ${config.PREFIX}
│ ⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
│ 📁 Latest: ${latestFile}
├─────────────────┤
│ Type ${config.PREFIX}help for commands
╰─────────────────╯`;

    api.sendMessage(message, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
      }
      const adminID = config.ADMINBOT && config.ADMINBOT[0] ? config.ADMINBOT[0] : senderID;
      api.shareContact("", adminID, threadID, (err, info) => {
        if (!err && info && info.messageID) {
          setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
        }
      });
    }, messageID);
  }
};
