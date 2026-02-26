const fs = require('fs-extra');
const path = require('path');

const spamTrackerPath = path.join(__dirname, './cache/data/spam_tracker.json');

function getSpamData() {
  try {
    fs.ensureDirSync(path.dirname(spamTrackerPath));
    if (!fs.existsSync(spamTrackerPath)) {
      fs.writeJsonSync(spamTrackerPath, { users: {}, autobanned: {} });
    }
    return fs.readJsonSync(spamTrackerPath);
  } catch {
    return { users: {}, autobanned: {} };
  }
}

function saveSpamData(data) {
  try {
    fs.ensureDirSync(path.dirname(spamTrackerPath));
    fs.writeJsonSync(spamTrackerPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save spam data:', err);
  }
}

function cleanExpiredBans(data) {
  const now = Date.now();
  let changed = false;
  
  for (const uid in data.autobanned) {
    if (data.autobanned[uid].expiresAt < now) {
      delete data.autobanned[uid];
      changed = true;
    }
  }
  
  if (changed) saveSpamData(data);
  return data;
}

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'autoban',
    aliases: ['spamban'],
    description: 'Toggle autoban for spammers (15 minutes ban)',
    usage: 'autoban [on/off/status/list]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  spamCheck: async function(api, event, Threads, config) {
    const { senderID, threadID, body } = event;
    
    if (config.ADMINBOT.includes(senderID)) return false;
    
    const settings = Threads.getSettings(threadID);
    if (!settings.autoban) return false;
    
    let data = getSpamData();
    data = cleanExpiredBans(data);
    
    if (data.autobanned[senderID]) {
      const remaining = Math.ceil((data.autobanned[senderID].expiresAt - Date.now()) / 60000);
      if (remaining > 0) {
        return { banned: true, remaining };
      }
    }
    
    const now = Date.now();
    const userKey = `${senderID}_${threadID}`;
    
    if (!data.users[userKey]) {
      data.users[userKey] = { messages: [], warns: 0 };
    }
    
    data.users[userKey].messages.push(now);
    data.users[userKey].messages = data.users[userKey].messages.filter(t => now - t < 10000);
    
    if (data.users[userKey].messages.length >= 7) {
      data.autobanned[senderID] = {
        bannedAt: now,
        expiresAt: now + (15 * 60 * 1000),
        reason: 'Spam detected',
        threadID
      };
      
      data.users[userKey] = { messages: [], warns: 0 };
      saveSpamData(data);
      
      return { newBan: true };
    }
    
    saveSpamData(data);
    return false;
  },
  
  isAutoBanned: function(senderID) {
    let data = getSpamData();
    data = cleanExpiredBans(data);
    
    if (data.autobanned[senderID]) {
      const remaining = Math.ceil((data.autobanned[senderID].expiresAt - Date.now()) / 60000);
      if (remaining > 0) return remaining;
    }
    return false;
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    const settings = Threads.getSettings(threadID);
    
    if (!action || action === 'status') {
      return send.reply(`Autoban Status
─────────────────
Status: ${settings.autoban ? 'ON' : 'OFF'}
Ban Duration: 15 minutes

Autoban triggers when a user sends 7+ messages in 10 seconds.

Usage:
- autoban on
- autoban off
- autoban list`);
    }
    
    if (action === 'on' || action === 'enable') {
      Threads.setSettings(threadID, { autoban: true });
      return send.reply('Autoban enabled.\n\nSpammers will be auto-banned for 15 minutes.');
    }
    
    if (action === 'off' || action === 'disable') {
      Threads.setSettings(threadID, { autoban: false });
      return send.reply('Autoban disabled.');
    }
    
    if (action === 'list') {
      let data = getSpamData();
      data = cleanExpiredBans(data);
      
      const banned = Object.entries(data.autobanned);
      
      if (banned.length === 0) {
        return send.reply('No users are currently auto-banned.');
      }
      
      let msg = `Auto-Banned Users (${banned.length})\n─────────────────\n`;
      
      for (const [uid, info] of banned) {
        const remaining = Math.ceil((info.expiresAt - Date.now()) / 60000);
        let name = 'Unknown';
        try {
          const userInfo = await api.getUserInfo(uid);
          name = userInfo[uid]?.name || 'Unknown';
        } catch {}
        
        msg += `${name}\nUID: ${uid}\nRemaining: ${remaining} min\n\n`;
      }
      
      return send.reply(msg);
    }
    
    return send.reply('Usage: autoban [on/off/status/list]');
  }
};

