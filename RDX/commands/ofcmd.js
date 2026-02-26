const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'ofcmd',
    aliases: ['offlinecmd'],
    description: 'List all offline commands and enable them by replying with number',
    credits: "SARDAR RDX",
    usage: 'ofcmd',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, send, client, config }) {
    const disabledCommands = config.DISABLED_COMMANDS || [];
    if (disabledCommands.length === 0) return send.reply('No offline commands found.');

    let msg = '╔════════════════════╗\n║    🌑 OFFLINE COMMANDS     ║\n╠════════════════════╣\n';
    disabledCommands.forEach((cmd, idx) => {
      msg += `  ✦ [${idx + 1}] ${cmd}\n`;
    });
    msg += '╚════════════════════╝\n\n💡 Reply with command number to ON it.';

    return api.sendMessage(msg, event.threadID, (err, info) => {
      if (!err) {
        client.replies.set(info.messageID, {
          commandName: 'ofcmd',
          author: event.senderID,
          data: disabledCommands
        });
      }
    }, event.messageID);
  },

  async handleReply({ api, event, client, config, data, send }) {
    const { body, senderID } = event;
    const selections = body.split(/[\s,]+/).map(s => s.trim()).filter(s => s !== '');
    const enabledResults = [];
    const invalidResults = [];

    for (const selection of selections) {
      const num = parseInt(selection);
      if (isNaN(num) || num < 1 || num > data.length) {
        invalidResults.push(selection);
        continue;
      }

      const commandToEnable = data[num - 1];
      config.DISABLED_COMMANDS = config.DISABLED_COMMANDS.filter(c => c !== commandToEnable);
      enabledResults.push(commandToEnable);
    }

    if (enabledResults.length > 0) {
      fs.writeJsonSync(path.join(process.cwd(), 'config.json'), config, { spaces: 2 });
      let response = `✅ Commands turned ON: ${enabledResults.join(', ')}`;
      if (invalidResults.length > 0) {
        response += `\n❌ Invalid numbers: ${invalidResults.join(', ')}`;
      }
      return send.reply(response);
    } else if (invalidResults.length > 0) {
      return send.reply(`❌ Invalid numbers: ${invalidResults.join(', ')}`);
    }
  }
};
