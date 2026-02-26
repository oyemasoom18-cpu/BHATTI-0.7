// const { tempBanned } = require('../../Data/system/handle/handleAntispam');

module.exports = {
  config: {
    name: 'disban',
    aliases: ['unbanuser'],
    description: 'Unban a user (Note: Antispam is currently disabled)',
    credits: "SARDAR RDX",
    usage: 'disban [reply/mention/UID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    return send.reply('ℹ️ Antispam system is currently disabled, so no users are in the temp-ban list.');
  }
};
