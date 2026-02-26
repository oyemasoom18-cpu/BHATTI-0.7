module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'unban',
    aliases: ['unbanuser'],
    description: "Unban a previously banned user.",
    usage: 'unban @user/uid',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Users }) {
    const { mentions } = event;
    
    let uid = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      return send.reply('Please mention a user, reply to their message, or provide their UID.');
    }
    
    if (!Users.isBanned(uid)) {
      return send.reply('This user is not banned.');
    }
    
    Users.unban(uid);
    
    let name = 'User';
    try {
      name = await Users.getValidName(uid, 'User');
    } catch {
      try {
        const info = await api.getUserInfo(uid);
        const rawName = info[uid]?.name;
        if (rawName && rawName.toLowerCase() !== 'facebook user' && rawName.toLowerCase() !== 'facebook') {
          name = rawName;
        }
      } catch {}
    }
    
    return send.reply(`Unbanned ${name} (${uid})`);
  }
};

