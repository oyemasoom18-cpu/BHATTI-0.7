module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'threadban',
    aliases: ['tban', 'blockthread'],
    description: "Ban a specific group from using the bot.",
    usage: 'threadban [ban/unban] [tid]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    const targetTID = args[1] || threadID;
    
    if (!action) {
      const thread = Threads.get(targetTID);
      const isBanned = thread?.banned === 1;
      return send.reply(`Thread ${targetTID} is currently ${isBanned ? 'BANNED' : 'ACTIVE'}.

Usage:
- threadban ban [tid] - Ban a thread
- threadban unban [tid] - Unban a thread`);
    }
    
    if (action === 'ban' || action === 'block') {
      Threads.ban(targetTID, 'Banned by admin');
      
      let threadName = 'Unknown';
      try {
        const info = await api.getThreadInfo(targetTID);
        threadName = info.threadName || info.name || 'Unknown';
      } catch {}
      
      return send.reply(`Thread Banned
─────────────────
Name: ${threadName}
TID: ${targetTID}

Bot will not respond in this thread.`);
    }
    
    if (action === 'unban' || action === 'unblock') {
      Threads.unban(targetTID);
      
      let threadName = 'Unknown';
      try {
        const info = await api.getThreadInfo(targetTID);
        threadName = info.threadName || info.name || 'Unknown';
      } catch {}
      
      return send.reply(`Thread Unbanned
─────────────────
Name: ${threadName}
TID: ${targetTID}

Bot will now respond in this thread.`);
    }
    
    return send.reply('Invalid action. Use: threadban [ban/unban] [tid]');
  }
};

