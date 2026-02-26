module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'setemoji',
    aliases: ['emoji', 'groupemoji'],
    description: 'Change the group emoji',
    usage: 'setemoji [emoji]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can change the group emoji.');
    }
    
    const emoji = args[0];
    
    if (!emoji) {
      return send.reply('Please provide an emoji.');
    }
    
    try {
      await api.changeThreadEmoji(emoji, threadID);
      return send.reply(`Group emoji changed to: ${emoji}`);
    } catch (error) {
      return send.reply('Failed to change group emoji.');
    }
  }
};

