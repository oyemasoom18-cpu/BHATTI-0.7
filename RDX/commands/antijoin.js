module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'antijoin',
    aliases: ['nojoin', 'lockjoin'],
    description: "Prevent new members from joining the group.",
    usage: 'antijoin [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be a group admin for anti-join to work.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can toggle anti-join.');
    }
    
    const settings = Threads.getSettings(threadID);
    const action = args[0]?.toLowerCase();
    
    if (action === 'on' || action === 'enable') {
      Threads.setSettings(threadID, { antijoin: true });
      return send.reply('Anti-Join: ENABLED\n\nNew members will be kicked automatically.');
    }
    
    if (action === 'off' || action === 'disable') {
      Threads.setSettings(threadID, { antijoin: false });
      return send.reply('Anti-Join: DISABLED');
    }
    
    const status = settings.antijoin ? 'ENABLED' : 'DISABLED';
    return send.reply(`Anti-Join: ${status}\n\nUsage: antijoin [on/off]`);
  }
};

