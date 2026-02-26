module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'removeadmin',
    aliases: ['demote', 'unadmin'],
    description: 'Remove admin from a user',
    usage: 'removeadmin @user',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID, mentions } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be a group admin to remove admins.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    let uid = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      return send.reply('Please mention a user or provide their UID.');
    }
    
    if (!adminIDs.includes(uid)) {
      return send.reply('This user is not a group admin.');
    }
    
    try {
      await api.changeAdminStatus(threadID, uid, false);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      return send.reply(`Removed ${name} from group admins.`);
    } catch (error) {
      return send.reply('Failed to remove admin: ' + error.message);
    }
  }
};

