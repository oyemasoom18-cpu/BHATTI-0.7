module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'kickall',
    aliases: ['removeall', 'cleargroup'],
    description: "Kick all members from the group (Owner Only).",
    usage: 'kickall [confirm]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be a group admin to kick members.');
    }
    
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isBotAdmin) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const participants = threadInfo.participantIDs || [];
    const membersToKick = participants.filter(id => 
      id !== botID && !adminIDs.includes(id)
    );
    
    if (membersToKick.length === 0) {
      return send.reply('No members to kick (only admins remaining).');
    }
    
    if (args[0]?.toLowerCase() !== 'confirm') {
      return send.reply(`Are you sure you want to kick ${membersToKick.length} members?

This will remove ALL non-admin members from the group.

Type: kickall confirm`);
    }
    
    await send.reply(`Kicking ${membersToKick.length} members...`);
    
    let kicked = 0;
    let failed = 0;
    
    for (const uid of membersToKick) {
      try {
        await api.removeUserFromGroup(uid, threadID);
        kicked++;
        await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }
    
    return send.reply(`Kickall Complete
─────────────────
Kicked: ${kicked}
Failed: ${failed}
Remaining: ${adminIDs.length} admins`);
  }
};

