module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'settheme',
    aliases: ['theme', 'color'],
    description: 'Change the group theme color',
    usage: 'settheme [color/id]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const themes = {
      'default': '196241301102133',
      'blue': '196241301102133',
      'yellow': '174636906462322',
      'green': '2136751179887052',
      'pink': '2058653964378557',
      'purple': '234137870477637',
      'red': '2129984390566328',
      'orange': '175615189761153',
      'gray': '549282842516657',
      'black': '788274591712841',
      'teal': '1928399724138152'
    };
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can change the theme.');
    }
    
    if (!args[0]) {
      let msg = 'Available themes:\n';
      msg += Object.keys(themes).join(', ');
      return send.reply(msg);
    }
    
    let themeID = args[0].toLowerCase();
    
    if (themes[themeID]) {
      themeID = themes[themeID];
    }
    
    try {
      await api.changeThreadColor(themeID, threadID);
      return send.reply('Group theme changed successfully!');
    } catch (error) {
      return send.reply('Failed to change theme. Use a valid theme name or ID.');
    }
  }
};

