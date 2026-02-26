module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'declinefr',
    aliases: ['decline', 'rejectfr', 'denyrequest'],
    description: 'Decline friend requests',
    usage: 'declinefr [uid/all]',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action) {
      return send.reply('Usage:\n- declinefr all - Decline all friend requests\n- declinefr [uid] - Decline specific request');
    }
    
    if (action === 'all') {
      await send.reply('Declining all friend requests...');
      
      try {
        const requests = await api.getPendingFriendRequests() || [];
        
        if (requests.length === 0) {
          return send.reply('No pending friend requests.');
        }
        
        let declined = 0;
        let failed = 0;
        
        for (const req of requests) {
          try {
            await api.handleFriendRequest(req.userID || req, false);
            declined++;
            await new Promise(r => setTimeout(r, 500));
          } catch {
            failed++;
          }
        }
        
        return send.reply(`Friend Requests
─────────────────
Declined: ${declined}
Failed: ${failed}`);
      } catch (error) {
        return send.reply('Failed to get friend requests: ' + error.message);
      }
    }
    
    const uid = action;
    
    if (!/^\d+$/.test(uid)) {
      return send.reply('Invalid UID format.');
    }
    
    try {
      await api.handleFriendRequest(uid, false);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      return send.reply(`Friend Request Declined
─────────────────
Name: ${name}
UID: ${uid}`);
    } catch (error) {
      return send.reply('Failed to decline friend request: ' + error.message);
    }
  }
};

