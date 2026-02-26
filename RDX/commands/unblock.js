module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'unblock',
    aliases: ['unblockuser'],
    description: "Unblock a previously blocked user.",
    usage: 'unblock [uid]',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const uid = args[0];
    
    if (!uid || !/^\d+$/.test(uid)) {
      return send.reply('Please provide a valid UID.\n\nUsage: unblock [uid]');
    }
    
    try {
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      await api.unblockUser(uid);
      
      return send.reply(`User Unblocked
─────────────────
Name: ${name}
UID: ${uid}

This user can now message the bot again.`);
    } catch (error) {
      return send.reply('Failed to unblock user: ' + error.message);
    }
  }
};

