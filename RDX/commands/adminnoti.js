module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'adminnoti',
    aliases: ['notification', 'noti'],
    description: "Toggle admin notifications for group events.",
    usage: 'adminnoti [message]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config, Users }) {
    const message = args.join(' ');
    
    if (!message) {
      return send.reply('Please provide a message to send.');
    }
    
    const admins = config.ADMINBOT || [];
    
    if (admins.length === 0) {
      return send.reply('No admins configured.');
    }
    
    let senderName = 'Admin';
    try {
      const info = await api.getUserInfo(event.senderID);
      if (info && info[event.senderID]) {
        const name = info[event.senderID].name;
        const firstName = info[event.senderID].firstName;
        const alternateName = info[event.senderID].alternateName;
        
        if (name && !name.toLowerCase().includes('facebook')) {
          senderName = name;
        } else if (firstName && !firstName.toLowerCase().includes('facebook')) {
          senderName = firstName;
        } else if (alternateName && !alternateName.toLowerCase().includes('facebook')) {
          senderName = alternateName;
        } else {
          senderName = await Users.getNameUser(event.senderID);
        }
      }
    } catch {
      senderName = await Users.getNameUser(event.senderID);
    }
    
    if (!senderName || senderName.toLowerCase().includes('facebook') || senderName === 'User') {
      senderName = 'Admin';
    }
    
    const notificationMessage = `🔔 ADMIN NOTIFICATION
─────────────────
From: ${senderName}
─────────────────
${message}`;
    
    let sent = 0;
    let failed = 0;
    
    for (const adminID of admins) {
      if (adminID === event.senderID) continue;
      try {
        await api.sendMessage(notificationMessage, adminID);
        sent++;
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('Failed to send to admin:', adminID, err.message);
        failed++;
      }
    }
    
    if (sent === 0 && admins.length === 1 && admins[0] === event.senderID) {
      return send.reply('You are the only admin configured.');
    }
    
    return send.reply(`✅ Notification sent to ${sent} admin(s).${failed > 0 ? `\n❌ Failed: ${failed}` : ''}`);
  }
};

