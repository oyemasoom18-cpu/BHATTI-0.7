module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'groupadmin',
    aliases: ['gadmin', 'grpadmin'],
    description: 'Add or remove group admins',
    usage: 'groupadmin [add/remove] [mention/reply/uid]',
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
      return send.reply('Bot must be a group admin to manage admins.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action || !['add', 'remove'].includes(action)) {
      return send.reply('Usage: groupadmin [add/remove] [mention/reply/uid]');
    }
    
    let uid = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[1] && /^\d+$/.test(args[1])) {
      uid = args[1];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      return send.reply('Please mention a user, reply to their message, or provide their UID.');
    }
    
    if (uid === botID) {
      return send.reply('Cannot modify bot admin status.');
    }
    
    try {
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      if (action === 'add') {
        if (adminIDs.includes(uid)) {
          return send.reply(`${name} is already a group admin.`);
        }
        
        await api.changeAdminStatus(threadID, uid, true);
        return send.reply(`Added ${name} as group admin.`);
      } else {
        if (!adminIDs.includes(uid)) {
          return send.reply(`${name} is not a group admin.`);
        }
        
        await api.changeAdminStatus(threadID, uid, false);
        return send.reply(`Removed ${name} from group admins.`);
      }
    } catch (error) {
      return send.reply('Failed to change admin status: ' + error.message);
    }
  }
};

