module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'top',
    aliases: ['rich', 'leaderboard', 'lb'],
    description: "View top users by balance or level.",
    usage: 'top [number]',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, args, send, Currencies, Users }) {
    const limit = Math.min(parseInt(args[0]) || 10, 20);
    
    const topUsers = Currencies.getTop(limit);
    
    if (topUsers.length === 0) {
      return send.reply('No users in the leaderboard yet.');
    }
    
    let msg = `RICHEST USERS
─────────────────\n`;
    
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(user.id);
        name = info[user.id]?.name || 'Unknown';
      } catch {}
      
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      msg += `${medal} ${name}\n   Total: ${user.total.toLocaleString()} Coins\n`;
    }
    
    return send.reply(msg);
  }
};

