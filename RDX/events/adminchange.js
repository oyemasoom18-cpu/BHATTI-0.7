module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'adminchange',
    eventType: 'log:thread-admins',
    description: 'Notify when admins change'
  },
  
  async run({ api, event, send, Users }) {
    const { threadID, logMessageData } = event;
    const { ADMIN_EVENT, TARGET_ID } = logMessageData;
    
    let name = null;
    
    try {
      const info = await api.getUserInfo(TARGET_ID);
      if (info && info[TARGET_ID]) {
        const fullName = info[TARGET_ID].name;
        const firstName = info[TARGET_ID].firstName;
        const alternateName = info[TARGET_ID].alternateName;
        
        if (fullName && !fullName.toLowerCase().includes('facebook') && fullName.toLowerCase() !== 'user') {
          name = fullName;
        } else if (firstName && !firstName.toLowerCase().includes('facebook') && firstName.toLowerCase() !== 'user') {
          name = firstName;
        } else if (alternateName && !alternateName.toLowerCase().includes('facebook') && alternateName.toLowerCase() !== 'user') {
          name = alternateName;
        }
      }
    } catch {}
    
    if (!name) {
      name = await Users.getNameUser(TARGET_ID);
    }
    
    if (!name || name.toLowerCase().includes('facebook') || name === 'User') {
      name = 'Member';
    }
    
    if (ADMIN_EVENT === 'add_admin') {
      send.send(`👑 ADMIN ADDED
─────────────────
${name} is now a group admin!`, threadID);
    } else if (ADMIN_EVENT === 'remove_admin') {
      send.send(`👤 ADMIN REMOVED
─────────────────
${name} is no longer a group admin.`, threadID);
    }
  }
};

