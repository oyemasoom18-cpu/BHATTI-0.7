module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'pin',
    aliases: ['pinmsg', 'pinmessage'],
    description: 'Pin or unpin a message in the group',
    usage: 'pin (reply to message) or pin unpin (reply)',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID, messageReply } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can pin/unpin messages.');
    }
    
    if (!messageReply) {
      return send.reply('Please reply to a message to pin/unpin it.');
    }
    
    const messageID = messageReply.messageID;
    const unpin = args[0]?.toLowerCase() === 'unpin';
    
    try {
      if (typeof api.pinMessage !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      await api.pinMessage(!unpin, messageID, threadID);
      return send.reply(unpin ? 'Message unpinned!' : 'Message pinned!');
    } catch (error) {
      return send.reply(`Failed to ${unpin ? 'unpin' : 'pin'} message: ${error.message || 'Unknown error'}`);
    }
  }
};

