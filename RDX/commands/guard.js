module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'guard',
    aliases: ['profileguard', 'shield'],
    description: "Toggle bot protection and integrity features.",
    usage: 'guard on/off',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can change profile guard settings.');
    }
    
    const arg = args[0]?.toLowerCase();
    
    if (!arg || !['on', 'off', 'enable', 'disable'].includes(arg)) {
      return send.reply('Please specify on or off.\n\nUsage: .guard on\n.guard off');
    }
    
    const enable = ['on', 'enable'].includes(arg);
    
    try {
      if (typeof api.setProfileGuard !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      await api.setProfileGuard(enable);
      return send.reply(`Profile guard ${enable ? 'enabled' : 'disabled'}!`);
    } catch (error) {
      return send.reply(`Failed to ${enable ? 'enable' : 'disable'} profile guard: ${error.message || 'Unknown error'}`);
    }
  }
};

