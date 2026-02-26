module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'accept',
    aliases: ['accept', 'acceptrequest', 'fr'],
    description: 'Accept friend requests',
    usage: 'accept [number/all/uid] or just accept to see list and reply',
    category: 'Friend',
    adminOnly: true,
    prefix: true
  },
  
  async acceptFriendRequest(api, userID) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'FriendingCometFriendRequestConfirmMutation',
      variables: JSON.stringify({
        input: {
          friend_requester_id: userID,
          source: 'friends_tab',
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.random().toString(36).substring(2)
        },
        scale: 3
      }),
      server_timestamps: true,
      doc_id: '3147613905362579'
    };
    
    const res = await api.httpPost('https://www.facebook.com/api/graphql/', form);
    return res;
  },
  
  async run({ api, event, args, send, config, client }) {
    const { senderID, messageID, threadID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: 'FriendingCometFriendRequestsRootQueryRelayPreloader',
        variables: JSON.stringify({ input: { scale: 3 } }),
        server_timestamps: true,
        doc_id: '4499164963466303'
      };
      
      const res = await api.httpPost('https://www.facebook.com/api/graphql/', form);
      const data = JSON.parse(res.replace('for (;;);', ''));
      
      let requests = [];
      try {
        const edges = data?.data?.viewer?.friending_possibilities?.edges || [];
        requests = edges.map(edge => ({
          userID: edge?.node?.id,
          name: edge?.node?.name || 'Unknown',
          mutual: edge?.node?.friendship_status?.mutual_friends_count || 0
        })).filter(r => r.userID);
      } catch {
        requests = [];
      }
      
      if (requests.length === 0) {
        return send.reply('No pending friend requests.');
      }
      
      if (!action) {
        let msg = `📬 Friend Requests (${requests.length})
─────────────────\n`;
        
        const top15 = requests.slice(0, 15);
        for (let i = 0; i < top15.length; i++) {
          msg += `\n${i + 1}. ${top15[i].name}`;
          if (top15[i].mutual > 0) msg += ` (${top15[i].mutual} mutual)`;
        }
        
        if (requests.length > 15) {
          msg += `\n\n... and ${requests.length - 15} more`;
        }
        
        msg += `\n─────────────────
Reply with number (1-15) or "all"`;
        
        const sentMsg = await api.sendMessage(msg, threadID);
        
        if (sentMsg && sentMsg.messageID && client && client.replies) {
          client.replies.set(sentMsg.messageID, {
            commandName: 'accept',
            author: senderID,
            data: {
              requests: top15,
              allRequests: requests,
              author: senderID
            },
            expireAt: Date.now() + (5 * 60 * 1000)
          });
          
          setTimeout(() => {
            client.replies.delete(sentMsg.messageID);
          }, 5 * 60 * 1000);
        }
        
        return;
      }
      
      if (action === 'all') {
        await send.reply(`Accepting ${requests.length} friend requests...`);
        
        let accepted = 0;
        let failed = 0;
        
        for (const req of requests) {
          try {
            await this.acceptFriendRequest(api, req.userID);
            accepted++;
            await new Promise(r => setTimeout(r, 1500));
          } catch {
            failed++;
          }
        }
        
        return send.reply(`✅ Friend Requests
─────────────────
Accepted: ${accepted}
Failed: ${failed}`);
      }
      
      const num = parseInt(action);
      if (!isNaN(num) && num >= 1 && num <= 15) {
        const index = num - 1;
        if (index >= requests.length) {
          return send.reply('Invalid number. That request does not exist.');
        }
        
        const req = requests[index];
        
        try {
          await this.acceptFriendRequest(api, req.userID);
          
          return send.reply(`✅ Friend Request Accepted
─────────────────
Name: ${req.name}
UID: ${req.userID}
Mutual Friends: ${req.mutual}`);
        } catch (error) {
          return send.reply('Failed to accept: ' + error.message);
        }
      }
      
      if (/^\d+$/.test(action)) {
        try {
          await this.acceptFriendRequest(api, action);
          
          let name = 'Unknown';
          try {
            const info = await api.getUserInfo(action);
            name = info[action]?.name || 'Unknown';
          } catch {}
          
          return send.reply(`✅ Friend Request Accepted
─────────────────
Name: ${name}
UID: ${action}`);
        } catch (error) {
          return send.reply('Failed to accept friend request: ' + error.message);
        }
      }
      
      return send.reply(`Usage:
• accept - Show top 15 requests (reply to select)
• accept [1-15] - Accept by number
• accept all - Accept all requests
• accept [uid] - Accept by specific UID`);
      
    } catch (error) {
      return send.reply('Failed to get friend requests: ' + error.message);
    }
  },
  
  async handleReply({ api, event, send, data, config }) {
    const Reply = data || {};
    const { senderID, body } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return;
    }
    
    if (Reply.author !== senderID) {
      return;
    }
    
    const input = body.trim().toLowerCase();
    const command = require('./accept');
    
    if (input === 'all') {
      const requests = Reply.allRequests || [];
      
      if (requests.length === 0) {
        return send.reply('No requests available.');
      }
      
      await send.reply(`Accepting ${requests.length} friend requests...`);
      
      let accepted = 0;
      let failed = 0;
      
      for (const req of requests) {
        try {
          await command.acceptFriendRequest(api, req.userID);
          accepted++;
          await new Promise(r => setTimeout(r, 1500));
        } catch {
          failed++;
        }
      }
      
      return send.reply(`✅ Friend Requests
─────────────────
Accepted: ${accepted}
Failed: ${failed}`);
    }
    
    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= 15) {
      const requests = Reply.requests || [];
      const index = num - 1;
      
      if (index >= requests.length) {
        return send.reply('Invalid number. That request does not exist.');
      }
      
      const req = requests[index];
      
      try {
        await command.acceptFriendRequest(api, req.userID);
        
        return send.reply(`✅ Friend Request Accepted
─────────────────
Name: ${req.name}
UID: ${req.userID}
Mutual Friends: ${req.mutual}`);
      } catch (error) {
        return send.reply('Failed to accept: ' + error.message);
      }
    }
    
    return send.reply('Please reply with a number (1-15) or "all".');
  }
};

