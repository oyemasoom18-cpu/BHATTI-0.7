const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'ignore',
    aliases: ['ignoreuser'],
    description: 'Ignore a user by reply, mention or UID',
    credits: "SARDAR RDX",
    usage: 'ignore [reply/mention/UID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, messageID, messageReply, mentions, senderID } = event;
    let targetID = '';

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
      targetID = args[0];
    }

    if (!targetID) return send.reply('⚠️ Please reply to a message, mention someone, or provide a UID to ignore.');
    if (config.ADMINBOT.includes(targetID)) return send.reply('❌ You cannot ignore a bot admin.');

    if (!config.IGNORED_USERS) config.IGNORED_USERS = [];
    if (config.IGNORED_USERS.includes(targetID)) {
      return send.reply(`ℹ️ User ${targetID} is already being ignored.`);
    }

    config.IGNORED_USERS.push(targetID);
    fs.writeJsonSync(path.join(process.cwd(), 'config.json'), config, { spaces: 2 });

    return send.reply(`✅ User ${targetID} has been added to the ignore list. Bot will no longer respond to them.`);
  }
};
