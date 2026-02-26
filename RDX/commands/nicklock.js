const fs = require('fs-extra');
const path = require('path');

const nicklockPath = path.join(__dirname, './cache/data/nicklock.json');

function getNicklockData() {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    if (!fs.existsSync(nicklockPath)) {
      fs.writeJsonSync(nicklockPath, { locks: {} });
    }
    return fs.readJsonSync(nicklockPath);
  } catch {
    return { locks: {} };
  }
}

function saveNicklockData(data) {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    fs.writeJsonSync(nicklockPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save nicklock data:', err);
  }
}

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'nicklock',
    aliases: ['locknick', 'nlock'],
    description: "Lock a user nickname to prevent changes.",
    usage: 'nicklock [uid/mention] [nickname] or nicklock off [uid/mention]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  checkNickChange: async function(api, threadID, userID, newNickname) {
    const data = getNicklockData();
    const key = `${threadID}_${userID}`;
    
    if (!data.locks[key]) return;
    
    const lockedNick = data.locks[key].nickname;
    
    if (newNickname !== lockedNick) {
      try {
        await api.changeNickname(lockedNick, threadID, userID);
      } catch (err) {
        console.error('Failed to restore nickname:', err);
      }
    }
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID, mentions } = event;
    
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isBotAdmin) {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(a => a.id);
        const isGroupAdmin = adminIDs.includes(senderID);
        
        if (!isGroupAdmin) {
          return send.reply('Only group admins or bot admins can use this command.');
        }
      } catch {
        return send.reply('Failed to verify admin status.');
      }
    }
    
    const data = getNicklockData();
    
    if (!args[0]) {
      const threadLocks = Object.entries(data.locks)
        .filter(([key]) => key.startsWith(threadID))
        .map(([key, value]) => ({ uid: key.split('_')[1], ...value }));
      
      if (threadLocks.length === 0) {
        return send.reply(`No locked nicknames in this group.

Usage:
- nicklock @user [nickname] - Lock nickname
- nicklock off @user - Unlock nickname
- nicklock list - Show locked nicknames`);
      }
      
      let msg = `🔒 Locked Nicknames (${threadLocks.length})
─────────────────\n`;
      
      for (const lock of threadLocks) {
        let name = 'Unknown';
        try {
          const info = await api.getUserInfo(lock.uid);
          name = info[lock.uid]?.name || info[lock.uid]?.firstName || 'Unknown';
        } catch {}
        
        msg += `\n${name}\nNickname: ${lock.nickname}\nUID: ${lock.uid}\n`;
      }
      
      return send.reply(msg);
    }
    
    if (args[0].toLowerCase() === 'list') {
      const threadLocks = Object.entries(data.locks)
        .filter(([key]) => key.startsWith(threadID))
        .map(([key, value]) => ({ uid: key.split('_')[1], ...value }));
      
      if (threadLocks.length === 0) {
        return send.reply('No locked nicknames in this group.');
      }
      
      let msg = `🔒 Locked Nicknames (${threadLocks.length})
─────────────────\n`;
      
      for (const lock of threadLocks) {
        let name = 'Unknown';
        try {
          const info = await api.getUserInfo(lock.uid);
          name = info[lock.uid]?.name || info[lock.uid]?.firstName || 'Unknown';
        } catch {}
        
        msg += `\n${name}\nNickname: ${lock.nickname}\nUID: ${lock.uid}\n`;
      }
      
      return send.reply(msg);
    }
    
    if (args[0].toLowerCase() === 'off' || args[0].toLowerCase() === 'unlock') {
      let uid = '';
      
      if (Object.keys(mentions).length > 0) {
        uid = Object.keys(mentions)[0];
      } else if (args[1] && /^\d+$/.test(args[1])) {
        uid = args[1];
      } else if (event.messageReply) {
        uid = event.messageReply.senderID;
      } else {
        return send.reply('Please mention a user or provide UID.');
      }
      
      const key = `${threadID}_${uid}`;
      
      if (!data.locks[key]) {
        return send.reply('This user does not have a locked nickname.');
      }
      
      delete data.locks[key];
      saveNicklockData(data);
      
      return send.reply('🔓 Nickname unlocked.');
    }
    
    let uid = '';
    let nickname = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
      const mentionText = mentions[uid];
      nickname = args.join(' ').replace(mentionText, '').trim();
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
      nickname = args.slice(1).join(' ');
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
      nickname = args.join(' ');
    } else {
      return send.reply('Please mention a user or provide UID with nickname.');
    }
    
    if (!nickname) {
      return send.reply('Please provide a nickname to lock.\n\nUsage: nicklock @user [nickname]');
    }
    
    try {
      await api.changeNickname(nickname, threadID, uid);
      
      const key = `${threadID}_${uid}`;
      data.locks[key] = {
        nickname,
        lockedBy: senderID,
        lockedAt: Date.now()
      };
      saveNicklockData(data);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || info[uid]?.firstName || 'Unknown';
      } catch {}
      
      return send.reply(`🔒 Nickname Locked
─────────────────
User: ${name}
Nickname: ${nickname}

This nickname will auto-restore if changed.`);
    } catch (error) {
      return send.reply('Failed to set nickname. Bot may not have admin rights: ' + error.message);
    }
  }
};

