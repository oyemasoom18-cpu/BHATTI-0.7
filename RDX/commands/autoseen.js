const fs = require('fs-extra');
const path = require('path');

// Shared state file (used by both command + event handler)
const statePath = path.join(__dirname, '../../Data/system/autosen.json');

function getState() {
  try {
    fs.ensureDirSync(path.dirname(statePath));
    if (!fs.existsSync(statePath)) {
      const defaultState = { enabled: true };
      fs.writeJsonSync(statePath, defaultState, { spaces: 2 });
      return defaultState;
    }
    return fs.readJsonSync(statePath);
  } catch {
    return { enabled: true };
  }
}

function saveState(state) {
  try {
    fs.ensureDirSync(path.dirname(statePath));
    fs.writeJsonSync(statePath, state, { spaces: 2 });
  } catch (e) {
    console.log('Failed to save autoseen state:', e.message);
  }
}

module.exports = {
  config: {
    name: 'autoseen',
    aliases: ['seen'],
    description: "Toggle auto-seen for received messages.",
    credits: "SARDAR RDX",
    usage: 'autoseen [on/off]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;

    // Extra safety: allow only group admins or bot admins to toggle
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const adminIDs = (threadInfo.adminIDs || []).map(a => a.id);
      const isGroupAdmin = adminIDs.includes(senderID);
      const isBotAdmin = (config.ADMINBOT || []).includes(senderID);

      if (!isGroupAdmin && !isBotAdmin) {
        return send.reply('Only group admins or bot owner can use this command.');
      }
    } catch {
      // If thread info fails, fall back to bot-admin-only
      if (!(config.ADMINBOT || []).includes(senderID)) {
        return send.reply('Only bot admins can use this command.');
      }
    }

    const action = (args[0] || '').toLowerCase();
    const state = getState();

    if (action === 'on') {
      state.enabled = true;
      saveState(state);
      return send.reply(
        '༻﹡﹡﹡﹡﹡﹡﹡༺\n' +
        'Auto-seen mode ENABLED for all new messages.\n' +
        'Owner: SARDAR RDX | Dev: Kashif Raza\n' +
        '༻﹡﹡﹡﹡﹡﹡﹡༺'
      );
    }

    if (action === 'off') {
      state.enabled = false;
      saveState(state);
      return send.reply(
        '༻﹡﹡﹡﹡﹡﹡﹡༺\n' +
        'Auto-seen mode DISABLED for new messages.\n' +
        'Owner: SARDAR RDX | Dev: Kashif Raza\n' +
        '༻﹡﹡﹡﹡﹡﹡﹡༺'
      );
    }

    const status = state.enabled ? 'ON' : 'OFF';
    return send.reply(
      `༻﹡﹡﹡﹡﹡﹡﹡༺\n` +
      `Current auto-seen status: ${status}\n` +
      `Use: ${config.PREFIX || '.'}autoseen on/off\n` +
      `༻﹡﹡﹡﹡﹡﹡﹡༺`
    );
  }
};

