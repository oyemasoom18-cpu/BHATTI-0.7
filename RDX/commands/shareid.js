module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'shareid',
    aliases: ['sharecontact', 'sid'],
    description: 'Share the contact card of a user',
    usage: 'shareid [mention/reply/uid]',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;
    let uid;

    if (messageReply) {
      uid = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else {
      uid = senderID;
    }

    try {
      const info = await api.getUserInfo(uid);
      const name = info[uid].name;
      const msg = `👤 **𝗡𝗮𝗺𝗲:** ${name}\n🆔 **𝗨𝗜𝗗:** ${uid}`;
      
      return api.shareContact(msg, uid, threadID);
    } catch (error) {
      return send.reply(`❌ Error: ${error.message}`);
    }
  }
};
