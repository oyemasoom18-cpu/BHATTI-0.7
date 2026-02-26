module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'antiout',
    aliases: ['noleave'],
    description: "Prevent members from leaving the group.",
    usage: 'antiout [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can toggle anti-out.');
    }
    
    const settings = Threads.getSettings(threadID);
    const action = args[0]?.toLowerCase();
    
    if (action === 'on' || action === 'enable') {
      Threads.setSettings(threadID, { antiout: true });
      return send.reply('Anti-Out: ENABLED\n\nMembers who leave will be added back.');
    }
    
    if (action === 'off' || action === 'disable') {
      Threads.setSettings(threadID, { antiout: false });
      return send.reply('Anti-Out: DISABLED');
    }
    
    const status = settings.antiout ? 'ENABLED' : 'DISABLED';
    return send.reply(`Anti-Out: ${status}\n\nUsage: antiout [on/off]`);
  }
};

