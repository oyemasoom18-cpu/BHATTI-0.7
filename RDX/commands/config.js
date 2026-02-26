module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'config',
    aliases: ['settings', 'botconfig'],
    description: "View and manage bot configuration.",
    usage: 'config [key] [value]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config.json');
    let envConfig = fs.readJsonSync(configPath);
    
    if (args.length === 0) {
      let msg = `BOT CONFIGURATION
─────────────────\n`;
      
      for (const [key, value] of Object.entries(envConfig)) {
        if (Array.isArray(value)) {
          msg += `${key}: [${value.length} items]\n`;
        } else {
          msg += `${key}: ${value}\n`;
        }
      }
      
      msg += `─────────────────
Usage: config [key] [value]`;
      
      return send.reply(msg);
    }
    
    const key = args[0].toUpperCase();
    const value = args.slice(1).join(' ');
    
    if (!value) {
      if (envConfig.hasOwnProperty(key)) {
        const val = envConfig[key];
        if (Array.isArray(val)) {
          return send.reply(`${key}: ${JSON.stringify(val)}`);
        }
        return send.reply(`${key}: ${val}`);
      }
      return send.reply(`Unknown config key: ${key}`);
    }
    
    if (!envConfig.hasOwnProperty(key)) {
      return send.reply(`Unknown config key: ${key}`);
    }
    
    const currentType = typeof envConfig[key];
    
    if (currentType === 'boolean') {
      envConfig[key] = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
    } else if (currentType === 'number') {
      envConfig[key] = Number(value);
    } else if (Array.isArray(envConfig[key])) {
      envConfig[key] = value.split(',').map(s => s.trim());
    } else {
      envConfig[key] = value;
    }
    
    fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
    
    return send.reply(`Updated ${key} to: ${JSON.stringify(envConfig[key])}`);
  }
};

