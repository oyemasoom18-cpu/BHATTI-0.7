module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'bio',
    aliases: ['setbio', 'changebio'],
    description: "Set or view a user's custom bio.",
    usage: 'bio [new bio text]',
    category: 'Profile',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const newBio = args.join(' ');
    
    if (!newBio) {
      return send.reply('Please provide new bio text.\n\nUsage: bio [your new bio]\n\nExample: bio SARDAR RDX Official');
    }
    
    if (newBio.length > 200) {
      return send.reply('Bio is too long. Maximum 200 characters.');
    }
    
    try {
      await api.changeBio(newBio);
      
      return send.reply(`BIO UPDATED
═══════════════════════
New Bio:
${newBio}
═══════════════════════`);
      
    } catch (error) {
      return send.reply('Failed to change bio: ' + error.message);
    }
  }
};

