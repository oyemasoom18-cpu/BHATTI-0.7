const fs = require('fs-extra');
const path = require('path');

const snbGroupsFile = path.join(__dirname, '../../Data/system/snb_groups.json');

// Load saved SNB groups
function loadSnbGroups() {
  try {
    if (fs.existsSync(snbGroupsFile)) {
      return fs.readJsonSync(snbGroupsFile);
    }
  } catch (e) { }
  return [];
}

// Save SNB groups
function saveSnbGroups(groups) {
  fs.writeJsonSync(snbGroupsFile, groups);
}

// Add new groups to SNB list
function addSnbGroup(groupID) {
  const groups = loadSnbGroups();
  if (!groups.includes(groupID)) {
    groups.push(groupID);
    saveSnbGroups(groups);
  }
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'snb',
    aliases: ['sharenewbot', 'newbot'],
    description: 'Share a new bot profile with a notification message to all groups',
    usage: 'snb [profile link or UID] [additional message]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config, Users }) {
    if (args.length === 0) return send.reply('⚠️ Please provide a profile link or UID and an optional message.\nUsage: .snb [link/UID] [message]');

    const input = args[0];
    const additionalMsg = args.slice(1).join(' ') || '';

    // Extract UID from link if necessary
    let targetID = input;
    if (input.includes('facebook.com') || input.includes('fb.com')) {
      try {
        const res = await api.getUID(input);
        targetID = res;
      } catch (e) {
        // Fallback to regex for common patterns if API fails or needs direct UID
        const match = input.match(/(?:profile\.php\?id=)?(\d+)/);
        if (match) targetID = match[1];
      }
    }

    if (!targetID || isNaN(targetID)) return send.reply('❌ Invalid Facebook profile link or UID.');

    const threads = require('../../Data/system/database/models/threads').getAll();
    let groups = [];
    try {
      const threadList = await api.getThreadList(500, null, ["INBOX"]);
      groups = threadList.filter(t => t.isGroup);
    } catch (e) {
      groups = threads.map(t => ({ threadID: t.id }));
    }

    if (groups.length === 0) return send.reply('❌ No groups found to share the new bot.');

    send.reply(`📤 Sharing new bot profile to ${groups.length} groups...`);

    const botName = config.BOTNAME;
    const broadcastMessage = `📢 𝐍𝐄𝐖 𝐁𝐎𝐓 𝐀𝐋𝐄𝐑𝐓\n\nAb is ID pe bot on hoga ya isay add kar lo. New bot link is shared below.\n\n${additionalMsg}\n\n🤖 ${botName}`.trim();

    let successCount = 0;
    let failCount = 0;

    for (const group of groups) {
      try {
        const groupID = group.threadID || group.id;
        await api.shareContact(broadcastMessage, targetID, groupID);
        addSnbGroup(groupID); // Save successful group ID
        successCount++;
        await new Promise(r => setTimeout(r, 3000)); // 3s delay for safety
      } catch (e) {
        failCount++;
      }
    }

    return send.reply(`✅ Finished sharing new bot!\n🟢 Success: ${successCount}\n🔴 Failed: ${failCount}\n📋 Groups saved: ${successCount}`);
  }
};

