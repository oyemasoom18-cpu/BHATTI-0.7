const moment = require('moment-timezone');

const utils = {
  getTime(format = 'hh:mm:ss A') {
    return moment().tz('Asia/Karachi').format(format);
  },

  getDate(format = 'DD/MM/YYYY') {
    return moment().tz('Asia/Karachi').format(format);
  },

  getDateTime() {
    return `${this.getTime()} || ${this.getDate()}`;
  },

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  },

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatMoney(amount) {
    return `$${this.formatNumber(amount)}`;
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  isValidUID(uid) {
    return /^\d+$/.test(uid);
  },

  getMentions(event) {
    const mentions = [];
    if (event.mentions) {
      for (const [uid, name] of Object.entries(event.mentions)) {
        mentions.push({ uid, name: name.replace('@', '') });
      }
    }
    return mentions;
  },

  getArgs(message, prefix) {
    const args = message.trim().split(/\s+/);
    if (prefix && args[0].toLowerCase().startsWith(prefix.toLowerCase())) {
      args[0] = args[0].slice(prefix.length);
    }
    return args;
  },

  parseCommand(message, prefix) {
    const args = this.getArgs(message, prefix);
    const commandName = args.shift()?.toLowerCase() || '';
    return { commandName, args };
  },

  truncate(str, length = 100) {
    if (str.length <= length) return str;
    return str.slice(0, length - 3) + '...';
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
};

module.exports = utils;
