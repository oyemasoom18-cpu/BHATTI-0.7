module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'mute',
    aliases: ['mutethread', 'silence'],
    description: "Mute a user or the entire group.",
    usage: 'mute [time] (1h/1d/forever) or mute off',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can mute threads.');
    }
    
    const arg = args[0]?.toLowerCase() || '1h';
    
    let muteSeconds;
    let muteText;
    
    switch (arg) {
      case 'off':
      case 'unmute':
      case '0':
        muteSeconds = 0;
        muteText = 'unmuted';
        break;
      case 'forever':
      case 'permanent':
      case '-1':
        muteSeconds = -1;
        muteText = 'muted permanently';
        break;
      case '1m':
      case '1min':
        muteSeconds = 60;
        muteText = 'muted for 1 minute';
        break;
      case '1h':
      case '1hour':
        muteSeconds = 3600;
        muteText = 'muted for 1 hour';
        break;
      case '1d':
      case '1day':
        muteSeconds = 86400;
        muteText = 'muted for 1 day';
        break;
      case '1w':
      case '1week':
        muteSeconds = 604800;
        muteText = 'muted for 1 week';
        break;
      default:
        const num = parseInt(arg);
        if (!isNaN(num)) {
          muteSeconds = num;
          muteText = `muted for ${num} seconds`;
        } else {
          muteSeconds = 3600;
          muteText = 'muted for 1 hour';
        }
    }
    
    try {
      if (typeof api.muteThread !== 'function') {
        return send.reply('This feature is not supported by the current API.');
      }
      
      await api.muteThread(threadID, muteSeconds);
      return send.reply(`Thread ${muteText}!`);
    } catch (error) {
      return send.reply(`Failed to mute thread: ${error.message || 'Unknown error'}`);
    }
  }
};

