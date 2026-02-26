module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'nickname',
    aliases: ['nick', 'setnick'],
    description: "Set or change a user's nickname.",
    usage: 'nickname @user [nickname]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID, mentions } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    let uid = '';
    let nickname = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
      const mentionText = mentions[uid];
      nickname = args.join(' ').replace(mentionText, '').trim();
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
      nickname = args.join(' ');
    } else if (args.length > 0) {
      uid = senderID;
      nickname = args.join(' ');
    } else {
      return send.reply('Usage: nickname @user [new nickname] or reply to a message');
    }
    
    if (uid !== senderID && !isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can change others nicknames.');
    }
    
    try {
      await api.changeNickname(nickname, threadID, uid);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      if (nickname) {
        return send.reply(`Changed ${name}'s nickname to: ${nickname}`);
      } else {
        return send.reply(`Removed ${name}'s nickname.`);
      }
    } catch (error) {
      return send.reply('Failed to change nickname.');
    }
  }
};

