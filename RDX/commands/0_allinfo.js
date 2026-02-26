module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'allinfo',
    aliases: ['allgroups', 'botgroups'],
    description: "Comprehensive system and bot information.",
    usage: 'allinfo',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, send, Threads, config }) {
    const { senderID, threadID } = event;

    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Only bot admins can use this command!');
    }

    await send.reply('⏳ Fetching all groups info... Please wait...');

    try {
      const threadList = await api.getThreadList(100, null, ['INBOX']);
      const groups = threadList.filter(t => t.isGroup);

      if (groups.length === 0) {
        return send.reply('❌ No groups found!');
      }

      let allInfo = `╔════════════════╗
║  𝐁𝐎𝐓 𝐆𝐑𝐎𝐔𝐏𝐒 𝐈𝐍𝐅𝐎  ║
║  Total: ${groups.length} Groups  ║
╚════════════════╝\n`;

      let count = 0;
      for (const group of groups) {
        if (count >= 15) {
          allInfo += `\n... and ${groups.length - 15} more groups`;
          break;
        }

        try {
          const info = await api.getThreadInfo(group.threadID);
          const admins = info.adminIDs || [];
          
          allInfo += `\n┌─────────────────
│ 📛 ${info.threadName || 'No Name'}
│ 🆔 TID: ${group.threadID}
│ 👥 Members: ${info.participantIDs?.length || 0}
│ 👑 Admins (${admins.length}):`;

          if (admins.length > 0) {
            for (let i = 0; i < Math.min(admins.length, 5); i++) {
              const adminId = admins[i].id;
              let adminName = 'Unknown';
              
              try {
                const userInfo = await api.getUserInfo(adminId);
                if (userInfo && userInfo[adminId]) {
                  adminName = userInfo[adminId].name || userInfo[adminId].firstName || 'Unknown';
                }
              } catch {}
              
              allInfo += `\n│  ${i + 1}. ${adminName}`;
              allInfo += `\n│     UID: ${adminId}`;
            }
            
            if (admins.length > 5) {
              allInfo += `\n│  ... +${admins.length - 5} more admins`;
            }
          } else {
            allInfo += `\n│  No admins`;
          }
          
          allInfo += `\n└─────────────────`;
          count++;
          
        } catch (err) {
          allInfo += `\n┌─────────────────
│ 📛 ${group.name || 'Unknown'}
│ 🆔 TID: ${group.threadID}
│ ❌ Could not fetch details
└─────────────────`;
          count++;
        }
      }

      const chunks = allInfo.match(/[\s\S]{1,4000}/g) || [allInfo];
      
      for (const chunk of chunks) {
        await api.sendMessage(chunk, threadID);
        await new Promise(r => setTimeout(r, 1000));
      }

    } catch (error) {
      return send.reply('❌ Error: ' + error.message);
    }
  }
};

