const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'clearbank',
    aliases: ['bankreset', 'clearlevel', 'cleardata'],
    description: "Clear all bank data (Admin Only).",
    usage: 'clearbank',
    category: 'Admin',
    prefix: true
  },

  async run({ api, event, send, Currencies, config }) {
    const { senderID, threadID, messageID } = event;

    // Check if user is bot admin
    if (!config.ADMINBOT || !config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Only bot admins can use this command!');
    }

    // Show menu
    const menuMessage = `
╔════════════════════════════════╗
║   🏦 CLEARBANK - Reset Menu    ║
╚════════════════════════════════╝

⚠️  WARNING: These operations cannot be undone!

📋 SELECT AN OPTION:

1️⃣  CLEAR ALL LEVELS
   → Remove experience/levels for all group members
   → Resets everyone back to Level 0

2️⃣  REMOVE ALL BANK MEMBERS
   → Delete all bank accounts
   → Clear all coins (wallet + bank)
   → Complete database wipe for this group

3️⃣  CLEAR EVERYTHING
   → Do BOTH operations above
   → Total reset of bank system

❌ EXIT
   → Cancel and go back

💬 Just reply with: 1, 2, or 3`;

    return api.sendMessage(menuMessage, threadID, (err, info) => {
      if (err) return;
      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: this.config.name,
        author: senderID,
        threadID: threadID,
        messageID: info.messageID,
        data: { action: 'menu' }
      });
      
      // Add emoji reactions to the message for easy interaction
      try {
        api.setMessageReaction('1️⃣', info.messageID, () => {}, true);
        api.setMessageReaction('2️⃣', info.messageID, () => {}, true);
        api.setMessageReaction('3️⃣', info.messageID, () => {}, true);
        api.setMessageReaction('❌', info.messageID, () => {}, true);
      } catch (e) {}
    });
  },

  async handleReply({ api, event, send, Currencies, config, handleReply }) {
    const { senderID, threadID, body, messageID } = event;

    // Only allow the original author to reply
    if (senderID !== handleReply.author) return;

    const choice = body.trim().toLowerCase();

    try {
      // Handle just numbers
      if (choice === '1') {
        return await clearLevels(api, send, Currencies, threadID, senderID);
      } 
      else if (choice === '2') {
        return await clearBankMembers(api, send, Currencies, threadID, senderID);
      } 
      else if (choice === '3') {
        return await clearEverything(api, send, Currencies, threadID, senderID);
      }
      else if (choice === 'exit' || choice === 'cancel' || choice === '0') {
        return send.reply('❌ Operation cancelled.');
      }
      else {
        return send.reply('❓ Invalid option. Please reply with just: 1, 2, or 3\n\n1 = Clear Levels\n2 = Remove Bank\n3 = Clear Everything');
      }
    } catch (error) {
      send.reply(`❌ Error: ${error.message}`);
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// CLEAR LEVELS FUNCTION
// ═══════════════════════════════════════════════════════════════
async function clearLevels(api, send, Currencies, threadID, senderID) {
  try {
    send.reply('⏳ Starting Level Wipe... Processing data...');

    let cleared = 0;

    // Get all users and clear their EXP
    if (Currencies && Currencies.getAllData) {
      const allData = Currencies.getAllData();
      
      for (const uid in allData) {
        try {
          // Set EXP to 0
          await Currencies.setExp(uid, 0);
          cleared++;
        } catch (e) {
          // Continue if one user fails
        }
      }
    }

    return send.reply(`
✅ LEVEL WIPE COMPLETE!

📊 Results:
  ✓ Processed: ${cleared} users
  ✓ All levels reset to Level 0
  ✓ All EXP cleared
  
⏰ Timestamp: ${new Date().toLocaleString()}

💾 Database saved with updates.`);

  } catch (error) {
    throw new Error(`Level clear failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// CLEAR BANK MEMBERS FUNCTION
// ═══════════════════════════════════════════════════════════════
async function clearBankMembers(api, send, Currencies, threadID, senderID) {
  try {
    send.reply('⏳ Starting Bank Wipe... This may take a moment...');

    let accountsRemoved = 0;
    let coinsCleared = 0;

    // Get all users and clear their bank data
    if (Currencies && Currencies.getAllData) {
      const allData = Currencies.getAllData();
      
      for (const uid in allData) {
        try {
          // Clear wallet balance (set to 0)
          await Currencies.setBalance(uid, 0);
          
          // Clear bank balance (set to 0)
          await Currencies.setBank(uid, 0);
          
          // Remove bank account details
          await Currencies.removeAccount(uid);
          
          accountsRemoved++;
          coinsCleared++;
        } catch (e) {
          // Continue if one user fails
        }
      }
    }

    return send.reply(`
✅ BANK WIPE COMPLETE!

📊 Results:
  ✓ Bank accounts removed: ${accountsRemoved}
  ✓ Users coins cleared: ${coinsCleared}
  ✓ All wallet balances: 0
  ✓ All bank balances: 0
  
⚠️  Note: All transaction history preserved
📅 Timestamp: ${new Date().toLocaleString()}

💾 Database saved with updates.
🔄 Bank system ready for fresh start!`);

  } catch (error) {
    throw new Error(`Bank clear failed: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// CLEAR EVERYTHING FUNCTION
// ═══════════════════════════════════════════════════════════════
async function clearEverything(api, send, Currencies, threadID, senderID) {
  try {
    send.reply('⏳ TOTAL RESET IN PROGRESS... Processing all data...\n\n⚠️  This cannot be undone!');

    let processed = 0;
    let levelsCleared = 0;
    let accountsRemoved = 0;
    let coinsCleared = 0;

    // Get all users and clear everything
    if (Currencies && Currencies.getAllData) {
      const allData = Currencies.getAllData();
      
      for (const uid in allData) {
        try {
          // Clear levels/EXP
          await Currencies.setExp(uid, 0);
          levelsCleared++;
          
          // Clear wallet balance
          await Currencies.setBalance(uid, 0);
          
          // Clear bank balance
          await Currencies.setBank(uid, 0);
          
          // Remove bank account
          await Currencies.removeAccount(uid);
          
          accountsRemoved++;
          coinsCleared++;
          processed++;
        } catch (e) {
          // Continue if one user fails
        }
      }
    }

    return send.reply(`
╔════════════════════════════════╗
║  ✅ TOTAL RESET COMPLETED!     ║
╚════════════════════════════════╝

📊 FULL RESULTS:
  ✓ Users processed: ${processed}
  ✓ Levels cleared: ${levelsCleared}
  ✓ Bank accounts removed: ${accountsRemoved}
  ✓ Coins cleared: ${coinsCleared}

🔄 DATABASE STATUS:
  ✓ All levels → 0
  ✓ All wallets → 0
  ✓ All banks → 0
  ✓ All accounts → Removed
  
📅 Timestamp: ${new Date().toLocaleString()}
💾 New database ready - Zero state achieved!

🚀 Bank system fully reset!
Ready for fresh start!`);

  } catch (error) {
    throw new Error(`Total reset failed: ${error.message}`);
  }
}

