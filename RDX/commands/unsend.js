module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'unsend',
    aliases: ['uns', 'del'],
    description: 'Unsend bot message',
    usage: 'unsend (reply to bot message)',
    category: 'Utility',
    adminOnly: false,
    prefix: true
  },
  
  async run({ api, event, send }) {
    const { messageReply } = event;
    
    if (!messageReply) {
      return send.reply('Please reply to a message to unsend.');
    }
    
    const botID = api.getCurrentUserID();
    
    if (messageReply.senderID !== botID) {
      return send.reply('I can only unsend my own messages.');
    }
    
    try {
      await api.unsendMessage(messageReply.messageID);
    } catch (error) {
      return send.reply('Failed to unsend message.');
    }
  }
};

