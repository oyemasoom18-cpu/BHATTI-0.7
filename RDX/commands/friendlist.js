module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'friendlist',
    aliases: ['friends', 'myfriends'],
    description: "View the bot's current friend list.",
    usage: 'friendlist [page]',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    await send.reply('Fetching friends list...');
    
    try {
      const friends = await api.getFriendsList();
      
      if (!friends || friends.length === 0) {
        return send.reply('No friends found.');
      }
      
      const page = parseInt(args[0]) || 1;
      const perPage = 20;
      const totalPages = Math.ceil(friends.length / perPage);
      const startIdx = (page - 1) * perPage;
      const endIdx = Math.min(startIdx + perPage, friends.length);
      const pageFriends = friends.slice(startIdx, endIdx);
      
      let msg = `FRIENDS LIST (${friends.length})
═══════════════════════
Page ${page}/${totalPages}
─────────────────\n\n`;
      
      for (let i = 0; i < pageFriends.length; i++) {
        const friend = pageFriends[i];
        const name = friend.fullName || friend.name || 'Unknown';
        const gender = friend.gender === 1 ? '♀' : friend.gender === 2 ? '♂' : '';
        
        msg += `${startIdx + i + 1}. ${name} ${gender}
   UID: ${friend.userID}\n`;
      }
      
      if (totalPages > 1) {
        msg += `\n─────────────────
Use: friendlist [page] for more`;
      }
      
      return send.reply(msg);
    } catch (error) {
      return send.reply('Failed to get friends list: ' + error.message);
    }
  }
};

