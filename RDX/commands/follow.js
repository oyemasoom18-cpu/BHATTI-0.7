module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'follow',
    aliases: ['followuser'],
    description: 'Follow or unfollow a user on Facebook',
    usage: 'follow @user or follow unfollow @user',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID, mentions } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const mentionIDs = Object.keys(mentions);
    let targetID;
    let unfollow = false;
    
    if (args[0]?.toLowerCase() === 'unfollow') {
      unfollow = true;
      if (mentionIDs.length > 0) {
        targetID = mentionIDs[0];
      } else if (args[1]) {
        targetID = args[1];
      }
    } else {
      if (mentionIDs.length > 0) {
        targetID = mentionIDs[0];
      } else if (args[0]) {
        targetID = args[0];
      }
    }
    
    if (!targetID) {
      return send.reply('Please mention a user or provide their UID.\n\nUsage:\n.follow @user\n.follow unfollow @user\n.follow 123456789');
    }
    
    try {
      if (typeof api.follow !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      await api.follow(targetID, !unfollow);
      return send.reply(`Successfully ${unfollow ? 'unfollowed' : 'followed'} user!`);
    } catch (error) {
      return send.reply(`Failed to ${unfollow ? 'unfollow' : 'follow'} user: ${error.message || 'Unknown error'}`);
    }
  }
};

