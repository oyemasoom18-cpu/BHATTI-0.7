const fs = require('fs-extra');
const path = require('path');

const autosendPath = path.join(__dirname, './cache/data/autosend.json');
let scheduledJobs = {};

function getAutosendData() {
  try {
    fs.ensureDirSync(path.dirname(autosendPath));
    if (!fs.existsSync(autosendPath)) {
      fs.writeJsonSync(autosendPath, { schedules: [] });
    }
    return fs.readJsonSync(autosendPath);
  } catch {
    return { schedules: [] };
  }
}

function saveAutosendData(data) {
  try {
    fs.ensureDirSync(path.dirname(autosendPath));
    fs.writeJsonSync(autosendPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save autosend data:', err);
  }
}

function formatInterval(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} second(s)`;
}

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'autosend',
    aliases: ['schedule', 'automsg'],
    description: "Schedule automatic messages for groups.",
    usage: 'autosend [add/remove/list] [interval_ms] [message]',
    category: 'Admin',
    adminOnly: true,
    groupOnly: true,
    prefix: true
  },
  
  initSchedules: function(api) {
    const data = getAutosendData();
    
    for (const job of Object.values(scheduledJobs)) {
      clearInterval(job);
    }
    scheduledJobs = {};
    
    for (const schedule of data.schedules) {
      if (schedule.active) {
        scheduledJobs[schedule.id] = setInterval(() => {
          try {
            api.sendMessage(schedule.message, schedule.threadID);
          } catch (err) {
            console.error('Autosend error:', err);
          }
        }, schedule.interval);
      }
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
    
    if (!action || action === 'list') {
      const data = getAutosendData();
      const threadSchedules = data.schedules.filter(s => s.threadID === threadID);
      
      if (threadSchedules.length === 0) {
        return send.reply(`No scheduled messages for this group.

Usage:
- autosend add [interval_ms] [message]
- autosend remove [id]
- autosend list

Example:
autosend add 3600000 Hourly reminder!`);
      }
      
      let msg = `Scheduled Messages (${threadSchedules.length})
═══════════════════════\n\n`;
      
      for (const s of threadSchedules) {
        msg += `ID: ${s.id}
Message: ${s.message.substring(0, 50)}...
Interval: ${formatInterval(s.interval)}
Status: ${s.active ? 'Active' : 'Paused'}
─────────────────\n`;
      }
      
      return send.reply(msg);
    }
    
    if (action === 'add') {
      const interval = parseInt(args[1]);
      const message = args.slice(2).join(' ');
      
      if (!interval || interval < 60000) {
        return send.reply('Minimum interval is 60000ms (1 minute).');
      }
      
      if (!message) {
        return send.reply('Please provide a message.\n\nUsage: autosend add [interval_ms] [message]');
      }
      
      const data = getAutosendData();
      const id = Date.now().toString(36);
      
      const newSchedule = {
        id,
        threadID,
        interval,
        message,
        active: true,
        createdBy: senderID,
        createdAt: Date.now()
      };
      
      data.schedules.push(newSchedule);
      saveAutosendData(data);
      
      scheduledJobs[id] = setInterval(() => {
        try {
          api.sendMessage(message, threadID);
        } catch (err) {
          console.error('Autosend error:', err);
        }
      }, interval);
      
      return send.reply(`Scheduled Message Added
─────────────────
ID: ${id}
Interval: ${formatInterval(interval)}
Message: ${message.substring(0, 100)}...`);
    }
    
    if (action === 'remove' || action === 'delete') {
      const id = args[1];
      
      if (!id) {
        return send.reply('Please provide the schedule ID.\n\nUsage: autosend remove [id]');
      }
      
      const data = getAutosendData();
      const index = data.schedules.findIndex(s => s.id === id && s.threadID === threadID);
      
      if (index === -1) {
        return send.reply('Schedule not found or not in this group.');
      }
      
      data.schedules.splice(index, 1);
      saveAutosendData(data);
      
      if (scheduledJobs[id]) {
        clearInterval(scheduledJobs[id]);
        delete scheduledJobs[id];
      }
      
      return send.reply(`Scheduled message ${id} removed.`);
    }
    
    return send.reply('Usage: autosend [add/remove/list]');
  }
};

