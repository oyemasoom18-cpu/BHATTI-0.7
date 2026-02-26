module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'all',
    aliases: ['tagall', 'everyone'],
    description: 'Tag all members in the group with proper mentions',
    usage: 'all [message]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (error) {
      return send.reply('Group info lene mein error aaya.');
    }
    
    const adminIDs = threadInfo.adminIDs?.map(a => a.id) || [];
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT?.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Sirf group admins sab ko tag kar sakte hain.');
    }
    
    const members = threadInfo.participantIDs || [];
    const customMessage = args.join(' ') || 'Attention!';
    
    if (members.length === 0) {
      return send.reply('Koi member nahi mila.');
    }
    
    let userInfoMap = {};
    try {
      userInfoMap = await api.getUserInfo(members);
    } catch (error) {
      console.log('Error fetching user info:', error.message);
    }
    
    const BATCH_SIZE = 10;
    const DELAY_MS = 1500;
    
    await send.reply(`📢 ${customMessage}\n─────────────────\nTagging ${members.length} members...`);
    
    await new Promise(r => setTimeout(r, 1000));
    
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      
      let mentions = [];
      let text = '';
      
      for (const uid of batch) {
        let rawName = userInfoMap[uid]?.name || 'Member';
        if (rawName.toLowerCase() === 'facebook user' || rawName.toLowerCase() === 'facebook') {
          rawName = userInfoMap[uid]?.firstName || 'Member';
          if (rawName.toLowerCase() === 'facebook') {
            rawName = 'Member';
          }
        }
        const firstName = rawName.split(' ')[0];
        const tag = `@${firstName}`;
        
        mentions.push({ 
          id: uid, 
          tag: tag,
          fromIndex: text.length
        });
        
        text += `${tag} `;
      }
      
      text = text.trim();
      
      try {
        await api.sendMessage({ body: text, mentions }, threadID);
      } catch (error) {
        console.log('Error sending mention batch:', error.message);
      }
      
      if (i + BATCH_SIZE < members.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
    await send.reply(`✅ ${members.length} members ko tag kar diya!`);
  }
};

