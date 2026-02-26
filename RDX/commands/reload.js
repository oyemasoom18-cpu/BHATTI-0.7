module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'reload',
    aliases: ['load', 'rl'],
    description: "Reload bot commands and configurations.",
    usage: 'reload [command/event name] | reload all | reload events | reload cmds',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, client }) {
    const { loadCommands, loadEvents, reloadCommand, reloadEvent, loadNewCommand } = require('../../Data/system/handle/handleRefresh');
    const path = require('path');
    const fs = require('fs-extra');
    
    const commandsPath = path.join(__dirname);
    const eventsPath = path.join(__dirname, '../events');
    
    const target = args[0]?.toLowerCase();
    const secondArg = args[1]?.toLowerCase();

    const getUniqueCount = () => {
      const unique = new Set();
      client.commands.forEach(cmd => {
        if (cmd.config && cmd.config.name) unique.add(cmd.config.name.toLowerCase());
      });
      return unique.size;
    };
    
    if (!target) {
      return send.reply(`╭─────────────╮
       🔄 𝐒𝐘𝐒𝐓𝐄𝐌 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯

┏━━━━━━━━━━━━━━┓
┃ 📂 .reload all      ┃
┃ 📦 .reload cmds     ┃
┃ 📡 .reload events   ┃
┃ 🎯 .reload [name]   ┃
┃ ✨ .reload new [name] ┃
┗━━━━━━━━━━━━━━┛

📊 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬:
┣ 📦 Commands: ${getUniqueCount()}
┗ 📡 Events: ${client.events.size}
━━━━━━━━━━━━━━━`);
    }
    
    if (target === 'all') {
      const cmdResult = await loadCommands(client, commandsPath);
      const evtResult = await loadEvents(client, eventsPath);
      
      return send.reply(`╭─────────────╮
       ✅ 𝐅𝐔𝐋𝐋 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯
✨ All systems updated!

📊 𝐍𝐞𝐰 𝐒𝐭𝐚𝐭𝐬:
┣ 📦 Commands: ${getUniqueCount()}
┗ 📡 Events: ${client.events.size}
━━━━━━━━━━━━━━━`);
    }
    
    if (target === 'commands' || target === 'cmds' || target === 'cmd') {
      const result = await loadCommands(client, commandsPath);
      
      if (result.success) {
        return send.reply(`╭─────────────╮
       📦 𝐂𝐌𝐃𝐒 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯
✨ Command module refreshed!

📊 Total: ${getUniqueCount()} unique
━━━━━━━━━━━━━━━`);
      } else {
        return send.reply(`❌ Error: ${result.error}`);
      }
    }
    
    if (target === 'events' || target === 'evt') {
      const result = await loadEvents(client, eventsPath);
      
      if (result.success) {
        return send.reply(`╭─────────────╮
       📡 𝐄𝐕𝐓𝐒 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯
✨ Event module refreshed!

📊 Total: ${client.events.size} events
━━━━━━━━━━━━━━━`);
      } else {
        return send.reply(`❌ Error: ${result.error}`);
      }
    }
    
    if (target === 'event' && secondArg) {
      const result = await reloadEvent(client, eventsPath, secondArg);
      
      if (result.success) {
        return send.reply(`╭─────────────╮
       📡 𝐄𝐕𝐄𝐍𝐓 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯
✨ Event [${result.name}] updated!
━━━━━━━━━━━━━━━`);
      } else {
        return send.reply(`❌ ${result.error}`);
      }
    }
    
    if (target === 'new' && secondArg) {
      const result = await loadNewCommand(client, commandsPath, secondArg);
      
      if (result.success) {
        return send.reply(`╭─────────────╮
       ✨ 𝐍𝐄𝐖 𝐋𝐎𝐀𝐃𝐄𝐃
╰─────────────╯
✨ New command [${result.name}] is live!

📊 Total: ${getUniqueCount()}
━━━━━━━━━━━━━━━`);
      } else {
        return send.reply(`❌ ${result.error}`);
      }
    }
    
    const result = await reloadCommand(client, commandsPath, target);
    
    if (result.success) {
      return send.reply(`╭─────────────╮
       📦 𝐂𝐌𝐃 𝐑𝐄𝐋𝐎𝐀𝐃
╰─────────────╯
✨ Command [${result.name}] updated!
━━━━━━━━━━━━━━━`);
    } else {
      return send.reply(`❌ ${result.error}`);
    }
  }
};
