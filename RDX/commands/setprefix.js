module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'setprefix',
    aliases: ['changeprefix'],
    description: "Set a custom prefix for the current group.",
    usage: 'setprefix [new prefix]',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const fs = require('fs-extra');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config.json');
    
    const newPrefix = args[0];
    
    if (!newPrefix) {
      return send.reply('Please provide a new prefix.');
    }
    
    if (newPrefix.length > 5) {
      return send.reply('Prefix cannot be longer than 5 characters.');
    }
    
    let envConfig = fs.readJsonSync(configPath);
    const oldPrefix = envConfig.PREFIX;
    envConfig.PREFIX = newPrefix;
    fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
    global.config = envConfig;
    
    return send.reply(`Prefix changed!
─────────────────
Old: ${oldPrefix}
New: ${newPrefix}`);
  }
};

