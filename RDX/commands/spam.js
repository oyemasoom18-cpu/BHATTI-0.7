module.exports = {
  config: {
    name: 'spamgc',
    aliases: ['spam', 'requestbox', 'pending'],
    description: 'Show spam/request groups and accept them',
    credits: "SARDAR RDX",
    usage: 'spamgc - show list, then reply with number',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  spamData: new Map(),

  async run({ api, event, send, client, config }) {
    const { threadID, senderID } = event;

    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Only bot admins can use this command!');
    }

    await send.reply('⏳ Fetching spam/request groups... Please wait...');

    try {
      const pendingThreads = await api.getThreadList(100, null, ['PENDING']);
      const otherThreads = await api.getThreadList(100, null, ['OTHER']);
      
      const allSpam = [...pendingThreads, ...otherThreads].filter(t => t.isGroup);

      if (allSpam.length === 0) {
        return send.reply('✅ No groups in spam/request box!');
      }

      let msg = `╔════════════════════╗
║  𝐒𝐏𝐀𝐌/𝐑𝐄𝐐𝐔𝐄𝐒𝐓 𝐆𝐑𝐎𝐔𝐏𝐒  ║
║  Total: ${allSpam.length} Groups  ║
╚═══════════════════╝\n`;

      const spamList = [];

      for (let i = 0; i < Math.min(allSpam.length, 20); i++) {
        const group = allSpam[i];
        spamList.push({
          index: i + 1,
          id: group.threadID,
          name: group.name || group.threadName || 'Unknown Group'
        });

        msg += `\n${i + 1}. ${group.name || group.threadName || 'Unknown'}`;
        msg += `\n   TID: ${group.threadID}`;
        msg += `\n   Members: ${group.participantIDs?.length || '?'}`;
        msg += `\n──────────────────`;
      }

      if (allSpam.length > 20) {
        msg += `\n\n... aur ${allSpam.length - 20} more groups`;
      }

      msg += `\n\n📌 Reply with number to accept`;
      msg += `\n📌 Reply "all" to accept all`;
      msg += `\n📌 Reply "1,3,5" for multiple`;

      this.spamData.set(threadID, spamList);

      const info = await send.reply(msg);

      if (client.replies && info?.messageID) {
        client.replies.set(info.messageID, {
          commandName: 'spamgc',
          author: senderID,
          data: { spamList, threadID }
        });

        setTimeout(() => {
          if (client.replies) client.replies.delete(info.messageID);
          this.spamData.delete(threadID);
        }, 300000);
      }

    } catch (error) {
      return send.reply('❌ Error: ' + error.message);
    }
  },

  async handleReply({ api, event, send, client, data, config }) {
    const { body, senderID, threadID } = event;

    if (!body) return;

    const originalAuthor = data?.author;
    const isAdmin = config?.ADMINBOT?.includes(senderID);

    if (originalAuthor && senderID !== originalAuthor && !isAdmin) {
      return send.reply('❌ Sirf command use karne wala ya admin reply kar sakta hai.');
    }

    const spamList = data?.spamList || this.spamData.get(threadID);

    if (!spamList || spamList.length === 0) {
      return send.reply('❌ Data expire ho gaya, phir se spamgc run karo.');
    }

    const input = body.trim().toLowerCase();
    let toAccept = [];

    if (input === 'all') {
      toAccept = spamList;
    } else if (input.includes(',')) {
      const nums = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      for (const num of nums) {
        const item = spamList.find(p => p.index === num);
        if (item) toAccept.push(item);
      }
    } else {
      const num = parseInt(input);
      if (!isNaN(num)) {
        const item = spamList.find(p => p.index === num);
        if (item) toAccept.push(item);
      }
    }

    if (toAccept.length === 0) {
      return send.reply('❌ Invalid number. List mein se number choose karo.');
    }

    await send.reply(`⏳ ${toAccept.length} group(s) accept ho rahe hain...`);

    let accepted = 0;
    let failed = 0;

    for (const item of toAccept) {
      try {
        await new Promise((resolve, reject) => {
          api.handleMessageRequest(item.id, true, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise(r => setTimeout(r, 1000));

        try {
          await api.sendMessage(`✅ 𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 𝐁𝐨𝐭 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝! 🚀`, item.id);
          
          // Set bot nickname automatically from config
          const botnick = config.BOTNICK || `{ ${config.PREFIX} } × ${config.BOTNAME || "bot"}`;
          try {
            await api.changeNickname(botnick, item.id, api.getCurrentUserID());
          } catch (e) {
            console.log("Nickname error in Spamgc:", e.message);
          }
        } catch {}

        accepted++;
        await new Promise(r => setTimeout(r, 500));

      } catch (error) {
        failed++;
      }
    }

    let resultMsg = `╔════════════════╗
║  𝐑𝐄𝐒𝐔𝐋𝐓𝐒  ║
╚═════════════════╝

✅ Accepted: ${accepted}
❌ Failed: ${failed}`;

    this.spamData.delete(threadID);

    return send.reply(resultMsg);
  }
};

