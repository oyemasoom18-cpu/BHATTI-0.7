module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'accountlist',
    aliases: ['acclist', 'bankusers'],
    description: 'Show list of all bank accounts sorted by balance',
    usage: 'accountlist',
    category: 'Admin',
    prefix: true,
    adminOnly: true
  },

  async run({ api, event, send, Currencies }) {
    const { threadID } = event;
    const db = require('../../Data/system/database/index.js');

    try {
      const accounts = db.prepare('SELECT * FROM bank_system WHERE account_number IS NOT NULL ORDER BY userId DESC').all();

      if (accounts.length === 0) {
        return send.reply("⚠️ Bank database mein koi accounts nahi mile.");
      }

      let msg = "🏦 ━━━━ 𝐑𝐃𝐗 𝐁𝐀𝐍𝐊 𝐔𝐒𝐄𝐑𝐒 ━━━━ 🏦\n\n";
      
      // Sort by actual balance from Currencies table
      const sortedAccounts = accounts.map(acc => {
        const actualBalance = Currencies.getTotal(acc.userId) || 0;
        return { ...acc, actualBalance };
      }).sort((a, b) => b.actualBalance - a.actualBalance);

      sortedAccounts.forEach((acc, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤";
        msg += `${medal} ${index + 1}. ${acc.full_name || "Unknown User"}\n`;
        msg += `   🆔 ACC: ${acc.account_number}\n`;
        msg += `   💰 BAL: ${acc.actualBalance.toLocaleString()} Coins\n`;
        msg += "───────────────────\n";
      });

      msg += `\n📊 Total Accounts: ${accounts.length}`;

      return send.reply(msg);
    } catch (error) {
      console.error(error);
      return send.reply("❌ List fetch karne mein masla hua.");
    }
  }
};

