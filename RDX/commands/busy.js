const fs = require('fs-extra');
const path = require('path');

const busyDataPath = path.join(__dirname, './cache/data/busy_data.json');

function getBusyData() {
  try {
    fs.ensureDirSync(path.dirname(busyDataPath));
    if (!fs.existsSync(busyDataPath)) {
      fs.writeJsonSync(busyDataPath, { threads: {} });
    }
    return fs.readJsonSync(busyDataPath);
  } catch {
    return { threads: {} };
  }
}

function saveBusyData(data) {
  try {
    fs.ensureDirSync(path.dirname(busyDataPath));
    fs.writeJsonSync(busyDataPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save busy data:', err);
  }
}

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'busy',
    aliases: ['afk', 'away'],
    description: "Set your status as busy with a reason.",
    usage: 'busy [on/off/check]',
    category: 'Admin',
    groupOnly: true,
    prefix: true
  },
  
  recordMention: function(threadID, senderID, senderName, message) {
    const data = getBusyData();
    
    if (!data.threads[threadID] || !data.threads[threadID].active) return;
    
    const adminID = data.threads[threadID].adminID;
    if (senderID === adminID) return;
    
    if (!data.threads[threadID].mentions) {
      data.threads[threadID].mentions = [];
    }
    
    data.threads[threadID].mentions.push({
      senderID,
      senderName,
      message: message.substring(0, 200),
      time: Date.now()
    });
    
    saveBusyData(data);
  },
  
  checkBusy: function(threadID, senderID) {
    const data = getBusyData();
    
    if (!data.threads[threadID]) return null;
    if (!data.threads[threadID].active) return null;
    if (data.threads[threadID].adminID !== senderID) return null;
    
    return data.threads[threadID];
  },
  
  clearBusy: function(threadID) {
    const data = getBusyData();
    if (data.threads[threadID]) {
      data.threads[threadID].active = false;
      data.threads[threadID].mentions = [];
      saveBusyData(data);
    }
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only admins can use this command.');
    }
    
    const action = args[0]?.toLowerCase();
    const data = getBusyData();
    
    if (!action || action === 'status') {
      const threadData = data.threads[threadID];
      const isActive = threadData?.active || false;
      const mentionCount = threadData?.mentions?.length || 0;
      
      return send.reply(`Busy Mode Status
─────────────────
Status: ${isActive ? 'ON' : 'OFF'}
Recorded Mentions: ${mentionCount}

Usage:
- busy on - Start recording mentions
- busy off - Stop and clear
- busy check - View recorded mentions`);
    }
    
    if (action === 'on' || action === 'enable') {
      if (!data.threads[threadID]) {
        data.threads[threadID] = {};
      }
      
      data.threads[threadID] = {
        active: true,
        adminID: senderID,
        startTime: Date.now(),
        mentions: []
      };
      
      saveBusyData(data);
      
      let name = 'Admin';
      try {
        const info = await api.getUserInfo(senderID);
        name = info[senderID]?.name || 'Admin';
      } catch {}
      
      return send.reply(`Busy Mode Enabled
─────────────────
${name} is now busy.

All mentions will be recorded and reported when admin returns.`);
    }
    
    if (action === 'off' || action === 'disable') {
      this.clearBusy(threadID);
      return send.reply('Busy mode disabled. All recorded mentions cleared.');
    }
    
    if (action === 'check' || action === 'report') {
      const threadData = data.threads[threadID];
      
      if (!threadData || !threadData.mentions || threadData.mentions.length === 0) {
        return send.reply('No mentions recorded.');
      }
      
      let msg = `Busy Report
─────────────────
Total Mentions: ${threadData.mentions.length}
─────────────────\n\n`;
      
      for (let i = 0; i < Math.min(threadData.mentions.length, 20); i++) {
        const m = threadData.mentions[i];
        const time = new Date(m.time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Karachi'
        });
        msg += `${m.senderName} (${time})\n"${m.message}"\n\n`;
      }
      
      if (threadData.mentions.length > 20) {
        msg += `... and ${threadData.mentions.length - 20} more mentions`;
      }
      
      this.clearBusy(threadID);
      return send.reply(msg + '\n\nBusy mode disabled.');
    }
    
    return send.reply('Usage: busy [on/off/check]');
  }
};

