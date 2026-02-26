module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'out',
    aliases: ['leave', 'bye'],
    description: "Make the bot leave the group.",
    usage: 'out',
    category: 'Group',
    groupOnly: true,
    prefix: true,
    adminOnly: true
  },
  
  async run({ api, event, send, config }) {
    const { threadID } = event;
    const botID = api.getCurrentUserID();
    
    await send.reply(`${config.BOTNAME} is leaving. Goodbye!`);
    
    setTimeout(() => {
      api.removeUserFromGroup(botID, threadID);
    }, 2000);
  }
};

