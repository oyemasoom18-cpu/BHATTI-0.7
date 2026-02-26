const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'restart',
    aliases: ['reboot'],
    description: "Restart the bot system completely.",
    usage: 'restart',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    await send.reply(`🔄 ${config.BOTNAME} is restarting...`);
    
    setTimeout(() => {
      process.exit(1); // Exit with non-zero to trigger Replit's auto-restart or our handler
    }, 2000);
  }
};

