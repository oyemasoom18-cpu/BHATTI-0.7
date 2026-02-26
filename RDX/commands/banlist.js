module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'banlist',
    aliases: ['banned', 'bans'],
    description: 'List banned users',
    usage: 'banlist',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, Users }) {
    const banned = Users.getBanned();
    
    if (banned.length === 0) {
      return send.reply('No banned users.');
    }
    
    let msg = `BANNED USERS (${banned.length})
─────────────────\n`;
    
    for (let i = 0; i < Math.min(banned.length, 15); i++) {
      const user = banned[i];
      msg += `${i + 1}. ${user.name || 'Unknown'}\n   UID: ${user.id}\n   Reason: ${user.banReason || 'No reason'}\n`;
    }
    
    msg += `\n─────────────────
Use .unban [uid] to unban`;
    
    return send.reply(msg);
  }
};

