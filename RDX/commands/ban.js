module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'ban',
    aliases: ['banuser'],
    description: "Ban a user from using the bot.",
    usage: 'ban @user/uid [reason]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Users }) {
    const { threadID, messageID, mentions } = event;
    
    let uid = '';
    let reason = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
      reason = args.slice(1).join(' ') || 'No reason provided';
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
      reason = args.slice(1).join(' ') || 'No reason provided';
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
      reason = args.join(' ') || 'No reason provided';
    } else {
      return send.reply('Please mention a user, reply to their message, or provide their UID.');
    }
    
    if (Users.isBanned(uid)) {
      return send.reply('This user is already banned.');
    }
    
    Users.ban(uid, reason);
    
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
    
    return send.reply(`Banned ${name} (${uid})\nReason: ${reason}`);
  }
};

