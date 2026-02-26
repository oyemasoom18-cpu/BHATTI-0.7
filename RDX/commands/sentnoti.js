const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'sentnoti',
    aliases: ['broadcastall', 'sendall'],
    description: "Send a notification to all groups.",
    usage: 'sentnoti [message]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const message = args.join(' ');
    if (!message) return send.reply('⚠️ Please enter a message to broadcast.');

    const threads = require('../../Data/system/database/models/threads').getAll();
    // Instead of filtering only approved, let's try to get all active threads the bot is in
    // However, the database usually only tracks threads the bot has seen.
    // Let's use api.getThreadList to get all groups the bot is currently in.
    
    send.reply('📤 Fetching group list and starting broadcast...');

    let successCount = 0;
    let failCount = 0;
    let threadList = [];

    try {
      // Get up to 500 threads
      threadList = await api.getThreadList(500, null, ["INBOX"]);
    } catch (e) {
      console.error('Error fetching thread list:', e);
      // Fallback to database if api fails
      threadList = threads.map(t => ({ threadID: t.id, isGroup: true }));
    }

    const groups = threadList.filter(t => t.isGroup && t.threadID !== event.threadID);
    
    if (groups.length === 0) {
       // If no groups found via API, fallback to database approved threads
       const fallbackGroups = threads.filter(t => t.id !== event.threadID);
       if (fallbackGroups.length === 0) return send.reply('❌ No other groups found to send the message.');
       groups.push(...fallbackGroups.map(t => ({ threadID: t.id })));
    }

    const ownerID = config.ADMINBOT[0];
    const botName = config.BOTNAME;

    for (const group of groups) {
      try {
        const targetID = group.threadID || group.id;
        const broadcastMessage = `📢 𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍\n\n${message}\n\n🤖 ${botName}`;
        await api.shareContact(broadcastMessage, ownerID, targetID);
        
        successCount++;
        await new Promise(r => setTimeout(r, 3000)); // Increased anti-spam delay to 3 seconds
      } catch (e) {
        failCount++;
      }
    }

    return send.reply(`✅ Broadcast completed!\n🟢 Success: ${successCount}\n🔴 Failed: ${failCount}`);
  }
};

