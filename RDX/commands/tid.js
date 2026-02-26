module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'tid',
    aliases: ['threadid', 'gid'],
    description: "Get the current thread (group) ID.",
    usage: 'tid',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, send }) {
    const { threadID, isGroup } = event;
    
    return send.reply(`${isGroup ? 'Group' : 'Thread'} ID:
─────────────────
${threadID}`);
  }
};

