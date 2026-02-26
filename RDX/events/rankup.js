const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'rankup',
    eventType: 'message',
    description: 'Auto-rankup listener'
  },
  
  async run({ api, event, Currencies, Users, client, config }) {
    // Rankup logic is handled in handleCommand.js calling rankup.js command
  }
};
