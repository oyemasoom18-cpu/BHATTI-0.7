
const fs = require('fs-extra');
const path = require('path');

const activeTargets = new Map();
const galiPath = path.join(__dirname, 'data/gali.txt');

function getGaliMessages() {
  try {
    const content = fs.readFileSync(galiPath, 'utf8');
    const messages = content.split('\n').filter(m => m.trim().length > 0);
    return messages;
  } catch {
    return ['T3RRRR1111 B3H3N K111 L0D333 😂😂🖕'];
  }
}

function getRandomMessage() {
  const messages = getGaliMessages();
  return messages[Math.floor(Math.random() * messages.length)];
}

async function startTagging(api, threadID, targetUID, config, cachedName) {
  const key = `${threadID}_${targetUID}`;
  
  if (activeTargets.has(key)) {
    return false;
  }
  
  let userName = cachedName || 'User';
  
  const interval = setInterval(async () => {
    try {
      const tag = `@${userName}`;
      const message = `${tag} ${getRandomMessage()}`;
      
      const mentions = [{
        tag: tag,
        id: targetUID,
        fromIndex: 0
      }];
      
      await api.sendMessage({
        body: message,
        mentions: mentions
      }, threadID);
    } catch (error) {
      console.error('FYT Error:', error.message);
    }
  }, 4000);
  
  activeTargets.set(key, interval);
  return true;
}

function stopTagging(threadID, targetUID) {
  const key = `${threadID}_${targetUID}`;
  
  if (!activeTargets.has(key)) {
    return false;
  }
  
  clearInterval(activeTargets.get(key));
  activeTargets.delete(key);
  return true;
}

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'fyt',
    aliases: ['fuckytag'],
    description: 'Tag someone repeatedly with messages from gali.txt',
    usage: 'fyt on @mention | fyt off @mention',
    category: 'Fun',
    adminOnly: false,
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config, Users }) {
    const { threadID, senderID, mentions } = event;
    
    if (args.length === 0) {
      return send.reply(`Usage:
━━━━━━━━━━━━━━━━
fyt on @mention - Start tagging
fyt off @mention - Stop tagging
━━━━━━━━━━━━━━━━

Tag kisi ko aur spam shuru karo! 😈`);
    }
    
    const action = args[0].toLowerCase();
    
    if (action !== 'on' && action !== 'off') {
      return send.reply('Invalid action! Use "on" or "off"');
    }
    
    const mentionIDs = Object.keys(mentions || {});
    
    if (mentionIDs.length === 0) {
      return send.reply('Please tag someone!\n\nExample: fyt on @user');
    }
    
    const targetUID = mentionIDs[0];
    let targetName = 'User';
    try {
      targetName = await Users.getValidName(targetUID, 'User');
    } catch {
      try {
        targetName = await Users.getNameUser(targetUID);
        if (targetName.toLowerCase() === 'facebook user' || targetName.toLowerCase() === 'facebook') {
          targetName = 'User';
        }
      } catch {}
    }
    
    if (action === 'on') {
      const isAdmin = config.ADMINBOT?.includes(senderID);
      
      if (!isAdmin) {
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(a => a.id);
        
        if (!adminIDs.includes(senderID)) {
          return send.reply('Only group admins can use this command! 😅');
        }
      }
      
      const started = startTagging(api, threadID, targetUID, config, targetName);
      
      if (!started) {
        return send.reply(`${targetName} already being tagged! 😈
Use "fyt off @${targetName}" to stop.`);
      }
      
      return send.reply(`╔═══════════════════════════╗
║   🔥 FYT MODE ACTIVATED 🔥   ║
╠═══════════════════════════╣

Target: ${targetName}
Speed: 4 seconds
Status: Running 😈

╚═══════════════════════════╝

Use "fyt off @${targetName}" to stop!`);
      
    } else if (action === 'off') {
      const stopped = stopTagging(threadID, targetUID);
      
      if (!stopped) {
        return send.reply(`${targetName} is not being tagged!`);
      }
      
      return send.reply(`╔═══════════════════════════╗
║   ✅ FYT MODE STOPPED ✅   ║
╠═══════════════════════════╣

Target: ${targetName}
Status: Deactivated 

╚═══════════════════════════╝`);
    }
  }
};

