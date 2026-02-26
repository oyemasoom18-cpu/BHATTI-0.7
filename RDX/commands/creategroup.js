module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'creategroup',
    aliases: ['newgroup', 'makegroup'],
    description: 'Create a new group with specified members',
    usage: 'creategroup [name] | @mention1 @mention2...',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID, mentions } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can create groups.');
    }
    
    const mentionIDs = Object.keys(mentions);
    
    if (mentionIDs.length < 1) {
      return send.reply('Please mention at least 1 person to create a group with.\n\nUsage: .creategroup Group Name | @user1 @user2');
    }
    
    const input = args.join(' ');
    const parts = input.split('|');
    let groupName = 'New Group';
    
    if (parts.length > 1) {
      groupName = parts[0].trim() || 'New Group';
    }
    
    mentionIDs.push(senderID);
    
    try {
      if (typeof api.createNewGroup !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      const threadID = await api.createNewGroup(mentionIDs, groupName);
      return send.reply(`Group "${groupName}" created successfully!\n\nThread ID: ${threadID}`);
    } catch (error) {
      return send.reply(`Failed to create group: ${error.message || 'Unknown error'}`);
    }
  }
};

