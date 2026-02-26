module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'admin',
    aliases: ['admins', 'botadmin'],
    description: "Add or remove bot admins.",
    usage: 'admin [add/remove/list] [uid]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();
    
    const configPath = path.join(__dirname, '../../config.json');
    let envConfig = fs.readJsonSync(configPath);
    
    if (!action || action === 'list') {
      const visibleAdmins = envConfig.ADMINBOT || [];
      let msg = `╭━━━『 ʙᴏᴛ ᴀᴅᴍɪɴs 』━━━╮\n`;
      msg += `┃ Total Admins: ${visibleAdmins.length}\n`;
      msg += `┣━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      for (let i = 0; i < visibleAdmins.length; i++) {
        try {
          const info = await api.getUserInfo(visibleAdmins[i]);
          let name = info[visibleAdmins[i]]?.name;
          if (!name || name.toLowerCase() === 'facebook user' || name.toLowerCase() === 'facebook') {
            name = info[visibleAdmins[i]]?.firstName || 'Admin';
          }
          msg += `┃ ${i + 1}. ${name}\n┃ 🆔: ${visibleAdmins[i]}\n`;
          if (i < visibleAdmins.length - 1) msg += `┣━━━━━━━━━━━━━━━━━━━━━━\n`;
        } catch {
          msg += `┃ ${i + 1}. 🆔: ${visibleAdmins[i]}\n`;
          if (i < visibleAdmins.length - 1) msg += `┣━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
      }
      msg += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      return send.reply(msg);
    }
    
    if (action === 'add') {
      const uidToAdd = args[1];
      if (!uidToAdd || !/^\d+$/.test(uidToAdd)) {
        return send.reply('Please provide a valid UID.');
      }
      
      if (envConfig.ADMINBOT.includes(uidToAdd)) {
        return send.reply('This user is already an admin.');
      }
      
      envConfig.ADMINBOT.push(uidToAdd);
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      
      let name = 'User';
      try {
        const info = await api.getUserInfo(uidToAdd);
        const rawName = info[uidToAdd]?.name;
        if (rawName && rawName.toLowerCase() !== 'facebook user' && rawName.toLowerCase() !== 'facebook') {
          name = rawName;
        } else if (info[uidToAdd]?.firstName && info[uidToAdd].firstName.toLowerCase() !== 'facebook') {
          name = info[uidToAdd].firstName;
        }
      } catch {}
      
      return send.reply(`Added ${name} (${uidToAdd}) as bot admin.`);
    }
    
    if (action === 'remove' || action === 'del') {
      const uidToRemove = args[1];
      if (!uidToRemove || !/^\d+$/.test(uidToRemove)) {
        return send.reply('Please provide a valid UID.');
      }

      if (!envConfig.ADMINBOT.includes(uidToRemove)) {
        return send.reply('This user is not an admin.');
      }
      
      if (envConfig.ADMINBOT.length === 1) {
        return send.reply('Cannot remove the last admin.');
      }
      
      envConfig.ADMINBOT = envConfig.ADMINBOT.filter(id => id !== uidToRemove);
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      
      return send.reply(`Removed ${uidToRemove} from bot admins.`);
    }
    
    return send.reply('Usage: admin [add/remove/list] [uid]');
  }
};

