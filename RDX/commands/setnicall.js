module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'setnicall',
    aliases: ['nickall', 'allnick'],
    description: 'Set nickname for all members',
    usage: 'setnicall [nickname]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    const nickname = args.join(' ');
    
    if (!nickname) {
      return send.reply('Please provide a nickname.');
    }
    
    const members = threadInfo.participantIDs || [];
    
    await send.reply(`Setting nickname for ${members.length} members...`);
    
    let success = 0;
    let failed = 0;
    
    for (const uid of members) {
      try {
        await api.changeNickname(nickname, threadID, uid);
        success++;
        await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }
    
    return send.reply(`Nickname Change Complete!
─────────────────
Success: ${success}
Failed: ${failed}`);
  }
};

