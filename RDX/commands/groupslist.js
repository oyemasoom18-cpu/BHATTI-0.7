module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'gclist',
    aliases: ['groups', 'gclist', 'groupslist'],
    description: "List all groups where the bot is a member.",
    usage: 'gclist',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, send, Threads }) {
    try {
      // Step 1: Get current thread list from Facebook API to verify active membership
      // Increased limit to 200 to catch more groups
      const threadList = await api.getThreadList(200, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup);
      const botID = api.getCurrentUserID();

      // Step 2: Get all threads from database
      const dbThreads = Threads.getAll();

      // Step 3: Map data and include groups that might be in API but not in DB yet
      let allFoundGroups = [];

      // Filter the API list to only those where bot is truly a participant
      const trulyActiveGroups = activeGroups.filter(t => t.participantIDs && t.participantIDs.includes(botID));
      const activeGroupIDs = trulyActiveGroups.map(t => t.threadID);

      // Add groups from DB that are truly active
      dbThreads.forEach(dbT => {
        if (activeGroupIDs.includes(dbT.id)) {
          allFoundGroups.push({
            id: dbT.id,
            name: dbT.name,
            approved: dbT.approved,
            banned: dbT.banned
          });
        }
      });

      // Add active groups from API that aren't in DB yet
      trulyActiveGroups.forEach(apiT => {
        if (!allFoundGroups.some(g => g.id === apiT.threadID)) {
          allFoundGroups.push({
            id: apiT.threadID,
            name: apiT.name || apiT.threadName || 'New Group',
            approved: 0,
            banned: 0,
            isNew: true
          });
          // Auto-sync to DB for future
          Threads.create(apiT.threadID, apiT.name || apiT.threadName || '');
        }
      });

      if (allFoundGroups.length === 0) {
        return send.reply('No active groups found where the bot is a member.');
      }

      let msg = `ACTIVE GROUPS LIST (${allFoundGroups.length})\n`;
      msg += `─────────────────\n`;

      for (let i = 0; i < Math.min(allFoundGroups.length, 50); i++) {
        const thread = allFoundGroups[i];
        const status = thread.approved === 1 ? '✅' : '❌';
        const banned = thread.banned === 1 ? '🚫' : '';
        const newTag = thread.isNew ? '✨ ' : '';
        msg += `${i + 1}. ${status}${banned} ${newTag}${thread.name}\n   ID: ${thread.id}\n`;
      }

      if (allFoundGroups.length > 50) {
        msg += `\n... and ${allFoundGroups.length - 50} more groups`;
      }

      msg += `\n─────────────────
✅ = Approved | ❌ = Not Approved | 🚫 = Banned
✨ = New/Syncing`;

      return send.reply(msg);
    } catch (error) {
      console.error(error);
      return send.reply('Failed to retrieve active group list.');
    }
  }
};

