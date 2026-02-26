module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'joinv2',
    aliases: ['jv2'],
    description: 'Owner activates a group for public joining',
    usage: 'joinv2',
    category: 'Public',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    const isOwner = config.ADMINBOT.includes(senderID);

    // List is only for Owner
    if (isOwner) {
      const allThreads = Threads.getAll();
      const activeThreads = [];
      const botID = api.getCurrentUserID();

      await send.reply('🔍 𝗖𝗵𝗲𝗰𝗸𝗶𝗻𝗴 𝗚𝗿𝗼𝘂𝗽𝘀... 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁.');

      for (const thread of allThreads) {
        try {
          const info = await api.getThreadInfo(thread.id);
          if (info && info.participantIDs && info.participantIDs.includes(botID)) {
            activeThreads.push({
              id: thread.id,
              name: info.threadName || thread.name || 'Unnamed Group'
            });
          }
        } catch (err) {}
      }

      if (activeThreads.length === 0) {
        return send.reply('❌ No active groups found.');
      }

      let msg = `✨ 𝗣𝗨𝗕𝗟𝗜𝗖 𝗚𝗥𝗢𝗨𝗣𝗦 𝗟𝗜𝗦𝗧 ✨\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (let i = 0; i < activeThreads.length; i++) {
        msg += `[ ${i + 1} ] 👥 ${activeThreads[i].name}\n`;
        msg += `🆔 𝗧𝗜𝗗: ${activeThreads[i].id}\n`;
        msg += `───────────────────────\n`;
      }

      msg += `\n📝 𝗢𝘄𝗻𝗲𝗿: Type the number to make it PUBLIC.`;

      const sentMsg = await send.reply(msg);

      if (global.client && global.client.replies) {
        global.client.replies.set(sentMsg.messageID, {
          commandName: 'joinv2',
          author: senderID,
          threads: activeThreads,
          type: 'owner_selection'
        });
      }
    } else {
      // For non-owners, they can only see the message if they type the command
      return send.reply('❌ This command list is only for Bot Owner. Join karne ke liye pehle owner ko group public karne dein.');
    }
  },

  handleReply: async function ({ api, event, send, config }) {
    const { body, senderID, messageReply, threadID } = event;
    if (!messageReply || !global.client.replies.has(messageReply.messageID)) return;

    const replyData = global.client.replies.get(messageReply.messageID);
    if (replyData.commandName !== 'joinv2') return;

    // Phase 1: Owner selects a group to make it public
    if (replyData.type === 'owner_selection') {
      if (!config.ADMINBOT.includes(senderID)) return;

      const num = parseInt(body);
      if (isNaN(num) || num < 1 || num > replyData.threads.length) {
        return send.reply('❌ Invalid number.');
      }

      const selectedThread = replyData.threads[num - 1];

      // Unsend the first message (list)
      api.unsendMessage(messageReply.messageID).catch(() => {});

      let publicMsg = `📢 𝗔𝗧𝗧𝗘𝗡𝗧𝗜𝗢𝗡 𝗘𝗩𝗘𝗥𝗬𝗢𝗡𝗘! 📢\n\n`;
      publicMsg += `Group **"${selectedThread.name}"** ab PUBLIC joining ke liye ON kar diya gaya hai! ✅\n\n`;
      publicMsg += `Jo members is group mein add hona chahte hain, wo is message par reply karein aur sirf group number type karein: **${num}**`;

      const sentPublicMsg = await api.sendMessage(publicMsg, threadID);

      // Auto delete 2nd message after 50 seconds
      setTimeout(() => {
        api.unsendMessage(sentPublicMsg.messageID).catch(() => {});
        // Also remove the reply listener from global client to clean up
        if (global.client && global.client.replies) {
           global.client.replies.delete(sentPublicMsg.messageID);
        }
      }, 50000);

      if (global.client && global.client.replies) {
        global.client.replies.set(sentPublicMsg.messageID, {
          commandName: 'joinv2',
          type: 'public_joining',
          targetThreadID: selectedThread.id,
          targetThreadName: selectedThread.name,
          num: num
        });
      }
      return;
    }

    // Phase 2: Public member replies with the number to join
    if (replyData.type === 'public_joining') {
      const typedNum = parseInt(body);
      if (typedNum !== replyData.num) return;

      const memberID = senderID;
      const targetThreadID = replyData.targetThreadID;
      const targetThreadName = replyData.targetThreadName;

      try {
        // First check if the user is already in the group
        const threadInfo = await api.getThreadInfo(targetThreadID);
        if (threadInfo.participantIDs.includes(memberID)) {
          const alreadyJoinedMsg = await api.sendMessage(`ℹ️ **Already Joined:** Aap pehle se hi "${targetThreadName}" mein majood hain.`, threadID);
          setTimeout(() => api.unsendMessage(alreadyJoinedMsg.messageID).catch(() => {}), 5000);
          return;
        }

        const botID = api.getCurrentUserID();
        const isBotAdmin = (threadInfo.adminIDs || []).some(a => a.id === botID);

        // Notify that adding is in progress
        const addingMsg = await api.sendMessage(`⏳ **Adding...** Aap ko "${targetThreadName}" mein add kiya ja raha hai...`, threadID);

        // Attempt to add the user
        await api.addUserToGroup(memberID, targetThreadID);

        // Notify success
        const successMsg = await api.sendMessage(`✅ **𝗦𝘂𝗰𝗰𝗲𝘀𝘀:** Aap ko "${targetThreadName}" mein add kar diya gaya hai!`, threadID);

        // Cleanup success messages
        setTimeout(() => {
          api.unsendMessage(addingMsg.messageID).catch(() => {});
          api.unsendMessage(successMsg.messageID).catch(() => {});
        }, 5000);

      } catch (error) {
        console.error("JoinV2 Public Joining Error:", error);
        const errorMsg = error.errorDescription || error.message || "Unknown error";

        if (errorMsg.includes('approval') || error.error === 1357031) {
          const appMsg = await api.sendMessage(`⚠️ **𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹 𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱:** Is group mein member approval laga hua hai. Group admins ko notification bhej di gayi hai.`, threadID);
          setTimeout(() => api.unsendMessage(appMsg.messageID).catch(() => {}), 10000);

          try {
            const info = await api.getUserInfo(memberID);
            const userName = info[memberID]?.name || "Member";
            const bodyMsg = `📢 **𝗔𝗱𝗺𝗶𝗻 𝗔𝘁𝘁𝗲𝗻𝘁𝗶𝗼𝗻!**\n\nNaya member joinv2 ke zariye add hona chahta hai lekin approval ki wajah se bot add nahi kar saka. Kindly manually add karein.\n\n👤 **Name:** ${userName}\n🆔 **UID:** ${memberID}`;
            await api.sendMessage(bodyMsg, targetThreadID);
          } catch (err) {}
        } else {
          const failMsg = await api.sendMessage(`❌ **𝗘𝗿𝗿𝗼𝗿:** Bot aap ko add nahi kar saka. (${errorMsg})\n\n💡 Tip: Apni Facebook privacy settings check karein.`, threadID);
          setTimeout(() => api.unsendMessage(failMsg.messageID).catch(() => {}), 10000);
        }
      }
    }
  }
};

