module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'resetdata',
    aliases: ['reset', 'cleardb'],
    description: "Reset your user data and progress.",
    usage: 'resetdata confirm',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, Currencies, config }) {
    const { senderID, threadID } = event;

    // Check if user is admin
    if (!config.ADMINBOT || !config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Only bot admins can use this command.');
    }

    // Require confirmation
    if (args[0]?.toLowerCase() !== 'confirm') {
      return send.reply(`⚠️ WARNING: This will delete ALL user data!
      
Usage: ${config.PREFIX}resetdata confirm

This will clear:
✗ All user balances
✗ All user banks
✗ All user experience/levels
✗ All bank accounts
✗ All currency data

Type: ${config.PREFIX}resetdata confirm (to proceed)`);
    }

    try {
      const beforeCount = Currencies.getAllCount();
      const result = Currencies.resetAllData();

      if (result.success) {
        send.reply(`✅ DATABASE RESET SUCCESSFUL

Reset completed:
  Before: ${beforeCount} users
  After: 0 users
  
  ✓ All user balances cleared
  ✓ All user banks cleared
  ✓ All user levels/EXP cleared
  ✓ All bank accounts cleared
  
Fresh data will be saved when users start using the bot.`);
      } else {
        send.reply(`❌ Reset failed: ${result.error}`);
      }
    } catch (error) {
      send.reply(`❌ Error during reset: ${error.message}`);
    }
  }
};

