module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'uidall',
    aliases: ['alluid', 'memberuids'],
    description: "Get UIDs of all members in the group.",
    usage: 'uidall',
    category: 'Utility',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, send }) {
    const { threadID } = event;
    
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.participantIDs || [];
      
      let msg = `GROUP MEMBER UIDs (${members.length})
─────────────────\n`;
      
      const MAX_MEMBERS = 30;
      const displayMembers = members.slice(0, MAX_MEMBERS);
      
      const usersInfo = await api.getUserInfo(displayMembers);
      
      for (let i = 0; i < displayMembers.length; i++) {
        const uid = displayMembers[i];
        let name = 'Member';
        const info = usersInfo[uid];
        
        if (info) {
          const rawName = info.name;
          if (rawName && rawName.toLowerCase() !== 'facebook user' && rawName.toLowerCase() !== 'facebook') {
            name = rawName;
          } else if (info.firstName && info.firstName.toLowerCase() !== 'facebook') {
            name = info.firstName;
          }
        }
        msg += `${i + 1}. ${name}\n   ${uid}\n`;
      }
      
      if (members.length > 30) {
        msg += `\n... and ${members.length - 30} more members`;
      }
      
      return send.reply(msg);
    } catch (error) {
      return send.reply('Failed to get member UIDs.');
    }
  }
};

