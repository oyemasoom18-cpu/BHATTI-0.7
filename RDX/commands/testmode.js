const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "testmode",
    aliases: ["test", "adminonly"],
    description: "Toggle bot test mode for developers.",
    usage: "testmode on/off",
    category: "Admin",
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, messageID } = event;
    const configPath = path.join(__dirname, '../../config.json');
    
    if (!args[0]) {
      return send.reply(`Usage: ${config.PREFIX}testmode on/off\nCurrent Status: ${config.ADMIN_ONLY_MODE ? "ON" : "OFF"}`);
    }

    const state = args[0].toLowerCase();
    let newState;

    if (state === "on") {
      newState = true;
    } else if (state === "off") {
      newState = false;
    } else {
      return send.reply("Please use 'on' or 'off'.");
    }

    try {
      const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      currentConfig.ADMIN_ONLY_MODE = newState;
      currentConfig.TEST_MODE = newState; // Keep both for compatibility
      
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
      
      // Update the live config object as well
      config.ADMIN_ONLY_MODE = newState;
      config.TEST_MODE = newState;

      return send.reply(`✅ Test Mode (Admin Only) has been turned ${newState ? "ON" : "OFF"}.\n${newState ? "Now only admins can use the bot." : "Now everyone can use the bot."}`);
    } catch (error) {
      return send.reply(`❌ Error updating config: ${error.message}`);
    }
  }
};
