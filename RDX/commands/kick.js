module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'kick',
    aliases: ['remove'],
    description: "Kick a user from the group.",
    usage: 'kick @user/uid',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Users, config }) {
    const { threadID, senderID, mentions } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be a group admin to kick members.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    let uid = '';
    
    if (mentions && Object.keys(mentions).length > 0) {
      const mentionIDs = Object.keys(mentions).filter(id => id && id !== "null");
      if (mentionIDs.length > 0) {
        uid = mentionIDs[0];
      }
    }
    
    if (!uid && args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (!uid && event.messageReply) {
      uid = event.messageReply.senderID;
    }

    if (!uid) {
      return send.reply('Please mention a user, reply to their message, or provide their UID.');
    }
    
    if (uid === botID) {
      return send.reply('Cannot kick the bot itself.');
    }
    
    if (adminIDs.includes(uid) && !isBotAdmin) {
      return send.reply('Cannot kick a group admin.');
    }
    
    try {
      await api.removeUserFromGroup(uid, threadID);
      
      let name = 'User';
      try {
        name = await Users.getValidName(uid, 'User');
      } catch {
        try {
          const info = await api.getUserInfo(uid);
          const rawName = info[uid]?.name;
          if (rawName && rawName.toLowerCase() !== 'facebook user' && rawName.toLowerCase() !== 'facebook') {
            name = rawName;
          }
        } catch {}
      }
      
      return send.reply(`Kicked ${name} from the group.`);
    } catch (error) {
      return send.reply('Failed to kick user: ' + error.message);
    }
  }
};

