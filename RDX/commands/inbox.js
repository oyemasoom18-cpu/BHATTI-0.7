module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'inbox',
    aliases: ['messages', 'dm'],
    description: 'View inbox messages and threads',
    usage: 'inbox [count]',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const count = parseInt(args[0]) || 10;
    const limit = Math.min(count, 25);
    
    await send.reply('Fetching inbox...');
    
    try {
      const threads = await api.getThreadList(limit, null, ['INBOX']);
      
      if (!threads || threads.length === 0) {
        return send.reply('No inbox messages found.');
      }
      
      let msg = `INBOX (${threads.length})
═══════════════════════\n\n`;
      
      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const name = thread.name || thread.threadName || 'Unknown';
        const isGroup = thread.isGroup;
        const unread = thread.unreadCount || 0;
        const lastMsg = thread.snippet || '';
        
        msg += `${i + 1}. ${isGroup ? '👥' : '👤'} ${name}
   ${unread > 0 ? `📩 Unread: ${unread}` : ''}
   Last: ${lastMsg.substring(0, 40)}${lastMsg.length > 40 ? '...' : ''}
   TID: ${thread.threadID}
─────────────────\n`;
      }
      
      return send.reply(msg);
    } catch (error) {
      return send.reply('Failed to fetch inbox: ' + error.message);
    }
  }
};

