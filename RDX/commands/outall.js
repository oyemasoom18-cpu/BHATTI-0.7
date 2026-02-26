module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'outall',
    aliases: ['leaveall', 'exitall'],
    description: "Make the bot leave all groups (Owner Only).",
    usage: 'outall [confirm]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const allThreads = Threads.getAll();
    const groupThreads = allThreads.filter(t => t.id !== threadID);
    
    if (groupThreads.length === 0) {
      return send.reply('No other groups to leave.');
    }
    
    if (args[0]?.toLowerCase() !== 'confirm') {
      return send.reply(`Are you sure you want to leave groups?

This will make bot leave ALL groups except this one.

Type: outall confirm`);
    }
    
    await send.reply(`Checking and leaving active groups...`);
    
    let left = 0;
    let alreadyLeft = 0;
    let failed = 0;
    const botID = api.getCurrentUserID();
    
    for (const thread of groupThreads) {
      try {
        const info = await api.getThreadInfo(thread.id);
        
        if (!info || !info.participantIDs || !info.participantIDs.includes(botID)) {
          alreadyLeft++;
          continue;
        }
        
        await api.removeUserFromGroup(botID, thread.id);
        left++;
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        if (err.message && (err.message.includes('not in') || err.message.includes('already left') || err.message.includes('not a participant'))) {
          alreadyLeft++;
        } else {
          failed++;
        }
      }
    }
    
    return send.reply(`Outall Complete
─────────────────
Left: ${left} groups
Already Left: ${alreadyLeft}
Failed: ${failed}
Remaining in this group only.`);
  }
};

