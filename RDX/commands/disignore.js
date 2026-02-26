const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'disignore',
    aliases: ['unignore'],
    description: 'Stop ignoring a user',
    credits: "SARDAR RDX",
    usage: 'disignore [reply/mention/UID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, messageReply, mentions } = event;
    let targetID = '';

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
      targetID = args[0];
    }

    if (!targetID) return send.reply('⚠️ Please reply to a message, mention someone, or provide a UID to stop ignoring.');

    if (!config.IGNORED_USERS) config.IGNORED_USERS = [];
    if (!config.IGNORED_USERS.includes(targetID)) {
      return send.reply(`ℹ️ User ${targetID} is not in the ignore list.`);
    }

    config.IGNORED_USERS = config.IGNORED_USERS.filter(id => id !== targetID);
    fs.writeJsonSync(path.join(process.cwd(), 'config.json'), config, { spaces: 2 });

    return send.reply(`✅ User ${targetID} has been removed from the ignore list.`);
  }
};
