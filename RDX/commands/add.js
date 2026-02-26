module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'add',
    aliases: ['adduser'],
    description: "Add a user to the group by ID.",
    usage: 'add [uid]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    // Check if bot is admin
    const isBotAdminInGroup = adminIDs.includes(botID);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    const uid = args[0];
    
    if (!uid || !/^\d+$/.test(uid)) {
      return send.reply('Please provide a valid UID.');
    }
    
    if (threadInfo.participantIDs.includes(uid)) {
      return send.reply('User is already in the group.');
    }
    
    try {
      if (isBotAdminInGroup) {
        // Direct add if bot is admin
        await api.addUserToGroup(uid, threadID);
        let name = 'Unknown';
        try {
          const info = await api.getUserInfo(uid);
          name = info[uid]?.name || 'Unknown';
        } catch {}
        return send.reply(`✅ Added ${name} to the group.`);
      } else {
        // Fallback if bot is NOT admin
        await api.addUserToGroup(uid, threadID);
        // If addUserToGroup still works (sometimes it does without admin depending on group settings)
        return send.reply(`✅ Successfully added user to the group.`);
      }
    } catch (error) {
      const errorMsg = error.errorDescription || error.message || "";
      
      // If adding failed and bot is not admin, try sending a join request/notification
      if (!isBotAdminInGroup) {
        try {
          const info = await api.getUserInfo(uid);
          const name = info[uid]?.name || uid;
          const bodyMsg = `📢 **𝗔𝗱𝗱 𝗥𝗲𝗾𝘂𝗲𝘀𝘁:** Ek member is user ko add karna chahta hai lekin bot admin nahi hai. Kindly manually add karein ya approval check karein.\n\n👤 **Name:** ${name}\n🆔 **UID:** ${uid}`;
          
          await api.sendMessage(bodyMsg, threadID);
          return send.reply(`⚠️ Bot admin nahi hai isliye direct add nahi kar saka. Group admins ko notification bhej di gayi hai.`);
        } catch (err) {
          return send.reply(`❌ Failed to add: Bot admin nahi hai aur notification bhi nahi ja saki.`);
        }
      }
      
      return send.reply(`❌ Failed to add user: ${errorMsg || 'Privacy settings may be preventing this.'}`);
    }
  }
};

