module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'history',
    aliases: ['chathistory', 'messages'],
    description: "Check command usage history in a group.",
    usage: 'history [count]',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can view message history.');
    }
    
    const count = parseInt(args[0]) || 10;
    const limitedCount = Math.min(Math.max(count, 1), 50);
    
    try {
      if (typeof api.getThreadHistory !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      const messages = await api.getThreadHistory(threadID, limitedCount, Date.now());
      
      if (!messages || messages.length === 0) {
        return send.reply('No messages found.');
      }
      
      let result = `Last ${messages.length} messages:\n${'─'.repeat(25)}\n\n`;
      
      for (const msg of messages.reverse()) {
        if (msg.type === 'message' && msg.body) {
          const senderName = msg.senderID;
          const text = msg.body.length > 50 ? msg.body.substring(0, 50) + '...' : msg.body;
          result += `[${senderName}]: ${text}\n`;
        }
      }
      
      return send.reply(result.trim() || 'No text messages found.');
    } catch (error) {
      return send.reply(`Failed to get history: ${error.message || 'Unknown error'}`);
    }
  }
};

