module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'uid',
    aliases: ['id', 'userid'],
    description: "Get yours or a mentioned user's Facebook ID.",
    usage: 'uid [@user]',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, args, send, Users }) {
    const { senderID, mentions } = event;
    
    let uid = senderID;
    
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      // Filter out empty mentions and get the last one
      const mentionIDs = Object.keys(event.mentions).filter(id => id && id !== "null");
      if (mentionIDs.length > 0) {
        uid = mentionIDs[mentionIDs.length - 1];
      }
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    }
    
    const name = await Users.getNameUser(uid);
    
    return send.reply(`User: ${name}
─────────────────
UID: ${uid}`);
  }
};

