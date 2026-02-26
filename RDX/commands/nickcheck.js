module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'nickcheck',
    aliases: ['checknick', 'setnickall'],
    description: 'Check and set bot nickname in all groups',
    usage: 'nickcheck',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, send, config }) {
    const { threadID } = event;
    const botID = api.getCurrentUserID();
    const botNickname = config.BOTNAME || 'Cato';
    
    await send.reply('🔍 Nickname check process shuru ho raha hai...');

    let successGroups = [];
    let errorGroups = [];
    let alreadySet = 0;

    try {
      const list = await api.getThreadList(100, null, ['INBOX']);
      const groups = list.filter(t => t.isGroup);

      for (const group of groups) {
        try {
          const threadInfo = await api.getThreadInfo(group.threadID);
          const currentNick = threadInfo.nicknames[botID];

          if (currentNick !== botNickname) {
            await api.changeNickname(botNickname, group.threadID, botID);
            successGroups.push(group.name || group.threadID);
          } else {
            alreadySet++;
          }
        } catch (err) {
          errorGroups.push(group.name || group.threadID);
        }
        // Small delay to avoid spamming
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let msg = `╭━━━━『 ɴɪᴄᴋ ᴄʜᴇᴄᴋ 』━━━━╮\n`;
      msg += `┃ ✅ Updated: ${successGroups.length}\n`;
      msg += `┃ ✨ Already Set: ${alreadySet}\n`;
      msg += `┃ ❌ Failed: ${errorGroups.length}\n`;
      
      if (successGroups.length > 0) {
        msg += `┣━━━━━━━━━━━━━━━━━━\n`;
        msg += `┃ 📝 Updated in:\n`;
        successGroups.slice(0, 10).forEach((name, i) => {
          msg += `┃ ${i + 1}. ${name.slice(0, 20)}\n`;
        });
        if (successGroups.length > 10) msg += `┃ ... and ${successGroups.length - 10} more\n`;
      }
      msg += `╰━━━━━━━━━━━━━━━━━━╯`;

      return send.reply(msg);
    } catch (error) {
      return send.reply(`❌ Error: ${error.message}`);
    }
  }
};
