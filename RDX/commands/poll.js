module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'poll',
    aliases: ['vote', 'createpoll'],
    description: 'Create a poll in the group',
    usage: 'poll [question] | [option1] | [option2] | ...',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can create polls.');
    }
    
    const input = args.join(' ');
    const parts = input.split('|').map(p => p.trim()).filter(p => p);
    
    if (parts.length < 2) {
      return send.reply('Please provide a question and at least one option.\n\nUsage: .poll What to eat? | Pizza | Burger | Biryani');
    }
    
    const question = parts[0];
    const optionsList = parts.slice(1);
    
    const options = {};
    optionsList.forEach(opt => {
      options[opt] = false;
    });
    
    try {
      if (typeof api.createPoll !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      await api.createPoll(question, threadID, options);
      return send.reply(`Poll created: "${question}"\n\nOptions:\n${optionsList.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
    } catch (error) {
      return send.reply(`Failed to create poll: ${error.message || 'Unknown error'}`);
    }
  }
};

