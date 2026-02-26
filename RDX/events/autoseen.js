const fs = require('fs-extra');
const path = require('path');

// Same state file as command uses
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

module.exports = {
  config: {
    name: 'autoseenEvent',
    eventType: 'message',
    version: '1.0.0',
    credits: "SARDAR RDX",
    description: 'Auto-seen handler for new messages'
  },

  async run({ api, event }) {
    // Only care about normal messages and replies
    if (event.type !== 'message' && event.type !== 'message_reply') return;

    const state = getState();
    if (!state.enabled) return;

    try {
      // Mark only this thread as read/seen
      await api.markAsRead(event.threadID);
    } catch (e) {
      // Silently ignore errors to avoid breaking other handlers
    }
  }
};


