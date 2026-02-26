const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'restart',
    aliases: ['reboot', 'rs', 'rerun', 'refresh'],
    description: "Emergency restart command for bot system.",
    usage: 'restart',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config, client }) {
    const startTime = Date.now();
    
    const processingMsg = await send.reply(`≿━━━━━━༺🔄༻━━━━━━≾
       𝐑𝐄𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆...
≿━━━━━━༺🔄༻━━━━━━≾

⏳ Please wait while bot is restarting...
🤖 Bot: ${config.BOTNAME || 'RDX Bot'}

📦 Reloading Commands...
📡 Reloading Events...
🔧 Clearing Cache...
≿━━━━━━༺🔄༻━━━━━━≾`);

    try {
      const { loadCommands, loadEvents, clearRequireCache } = require('../../Data/system/handle/handleRefresh');
      
      const commandsPath = path.join(__dirname);
      const eventsPath = path.join(__dirname, '../events');
      const newCommandsPath = path.join(__dirname, 'NEW COMMANDS');
      
      const oldCmdCount = client.commands?.size || 0;
      const oldEvtCount = client.events?.size || 0;
      
      const cmdResult = await loadCommands(client, commandsPath);
      
      if (fs.existsSync(newCommandsPath)) {
        const newCmdFiles = fs.readdirSync(newCommandsPath).filter(f => f.endsWith('.js'));
        for (const file of newCmdFiles) {
          try {
            const filePath = path.join(newCommandsPath, file);
            clearRequireCache(filePath);
            const command = require(filePath);
            
            if (command.config && command.config.name) {
              client.commands.set(command.config.name.toLowerCase(), command);
              
              if (command.config.aliases && Array.isArray(command.config.aliases)) {
                command.config.aliases.forEach(alias => {
                  client.commands.set(alias.toLowerCase(), command);
                });
              }
            }
          } catch (err) {
            console.error(`Failed to load NEW COMMAND ${file}:`, err.message);
          }
        }
      }
      
      const evtResult = await loadEvents(client, eventsPath);
      
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
      
      const newCmdCount = client.commands?.size || 0;
      const newEvtCount = client.events?.size || 0;
      
      await send.reply(`≿━━━━━━༺✅༻━━━━━━≾
   𝐑𝐄𝐒𝐓𝐀𝐑𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋!
≿━━━━━━༺✅༻━━━━━━≾

🤖 Bot: ${config.BOTNAME || 'RDX Bot'}
⏱️ Time: ${timeTaken}s

📦 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:
   ├ Before: ${oldCmdCount}
   └ After: ${newCmdCount}

📡 𝐄𝐯𝐞𝐧𝐭𝐬:
   ├ Before: ${oldEvtCount}
   └ After: ${newEvtCount}

✅ All changes have been applied!
🔥 Bot is running smoothly!
≿━━━━━━༺✅༻━━━━━━≾`);

    } catch (error) {
      console.error('Restart error:', error);
      
      await send.reply(`≿━━━━━━༺❌༻━━━━━━≾
     𝐑𝐄𝐒𝐓𝐀𝐑𝐓 𝐅𝐀𝐈𝐋𝐄𝐃!
≿━━━━━━༺❌༻━━━━━━≾

❌ Error: ${error.message}

💡 Try using .reload all instead
≿━━━━━━༺❌༻━━━━━━≾`);
    }
  }
};

