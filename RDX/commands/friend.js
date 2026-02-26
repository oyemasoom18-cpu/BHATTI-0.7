module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'friend',
    aliases: ['addfriend', 'fr'],
    description: 'Send friend request',
    usage: 'friend [uid/profile link]',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    let uid = args[0];
    
    if (!uid) {
      return send.reply('Please provide a UID or profile link.\n\nUsage: friend [uid/profile link]');
    }
    
    if (uid.includes('facebook.com')) {
      const match = uid.match(/(?:id=|profile\.php\?id=)(\d+)/);
      if (match) {
        uid = match[1];
      } else {
        const usernameMatch = uid.match(/facebook\.com\/([^/?]+)/);
        if (usernameMatch) {
          try {
            const id = await api.getUID(usernameMatch[1]);
            uid = id;
          } catch {
            return send.reply('Could not get UID from profile link.');
          }
        }
      }
    }
    
    if (!/^\d+$/.test(uid)) {
      return send.reply('Invalid UID format.');
    }
    
    try {
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      await api.addUserToFriends(uid);
      
      return send.reply(`Friend Request Sent
─────────────────
Name: ${name}
UID: ${uid}`);
    } catch (error) {
      return send.reply('Failed to send friend request: ' + error.message);
    }
  }
};

