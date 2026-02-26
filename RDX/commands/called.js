module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'called',
    aliases: ['callme', 'calladmin'],
    description: "Check who called or mentioned the bot.",
    usage: 'called [message]',
    category: 'Utility',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config, Users }) {
    const { threadID, senderID } = event;
    const message = args.join(' ');
    
    if (!message) {
      return send.reply('Please provide a message for the admin.\n\nUsage: called [your message]');
    }
    
    const adminID = config.ADMINBOT[0];
    
    if (!adminID) {
      return send.reply('No admin configured.');
    }
    
    let senderName = 'Unknown';
    try {
      senderName = await Users.getNameUser(senderID);
    } catch {}
    
    let threadName = 'Unknown Group';
    try {
      const info = await api.getThreadInfo(threadID);
      threadName = info.threadName || info.name || 'Unknown Group';
    } catch {}
    
    const callMessage = `ADMIN CALLED!
═══════════════════════
From: ${senderName}
UID: ${senderID}
Group: ${threadName}
TID: ${threadID}
═══════════════════════

Message:
${message}

═══════════════════════
Reply to this message to respond.`;
    
    try {
      const sentMsg = await api.sendMessage(callMessage, adminID);
      
      if (global.client && global.client.replies) {
        global.client.replies.set(sentMsg.messageID, {
          commandName: 'called',
          author: senderID,
          threadID: threadID,
          type: 'callback'
        });
      }
      
      return send.reply('Message sent to admin. They will reply soon.');
    } catch (error) {
      return send.reply('Failed to send message to admin: ' + error.message);
    }
  },
  
  async onReply({ api, event, send }) {
    const { body, threadID } = event;
    const replyData = global.client.replies.get(event.messageReply.messageID);
    
    if (!replyData || replyData.commandName !== 'called') return;
    
    try {
      await api.sendMessage(`Admin Reply:
─────────────────
${body}`, replyData.threadID);
      
      send.reply('Reply sent to user.');
      global.client.replies.delete(event.messageReply.messageID);
    } catch (error) {
      send.reply('Failed to send reply: ' + error.message);
    }
  }
};

