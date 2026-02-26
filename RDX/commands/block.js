module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'block',
    aliases: ['blockuser'],
    description: "Block a user from interacting with the bot.",
    usage: 'block [uid/mention]',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID, mentions } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    let uid = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      return send.reply('Please mention a user, reply to their message, or provide their UID.');
    }
    
    try {
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      await api.blockUser(uid);
      
      return send.reply(`User Blocked
─────────────────
Name: ${name}
UID: ${uid}

This user can no longer message the bot.`);
    } catch (error) {
      return send.reply('Failed to block user: ' + error.message);
    }
  }
};

