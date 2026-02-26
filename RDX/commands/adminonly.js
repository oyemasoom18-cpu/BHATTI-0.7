module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'adminonly',
    aliases: ['onlyadmin', 'adminmode'],
    description: "Enable or disable Admin-Only mode.",
    usage: 'adminonly [on/off]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config.json');
    let envConfig = fs.readJsonSync(configPath);
    
    const action = args[0]?.toLowerCase();
    
    if (action === 'on' || action === 'true' || action === 'enable') {
      envConfig.ADMIN_ONLY_MODE = true;
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      return send.reply('Admin Only Mode: ENABLED\n\nOnly bot admins can use commands now.');
    }
    
    if (action === 'off' || action === 'false' || action === 'disable') {
      envConfig.ADMIN_ONLY_MODE = false;
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      return send.reply('Admin Only Mode: DISABLED\n\nEveryone can use commands now.');
    }
    
    const status = envConfig.ADMIN_ONLY_MODE ? 'ENABLED' : 'DISABLED';
    return send.reply(`Admin Only Mode: ${status}\n\nUsage: adminonly [on/off]`);
  }
};

