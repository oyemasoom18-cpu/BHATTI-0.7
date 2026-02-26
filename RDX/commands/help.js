module.exports = {
  config: {
    name: 'help',
    aliases: ['h', 'menu', 'cmds'],
    description: "View all available commands and guides.",
    credits: "SARDAR RDX",
    usage: 'help [command] | help [page] | help all',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, args, send, client, config }) {
    const { threadID, senderID } = event;
    const moment = require('moment-timezone');

    if (args[0]) {
      const input = args[0].toLowerCase();

      if (input === 'all') {
        return showFullHelp({ api, event, send, client, config });
      }

      if (!isNaN(input)) {
        const page = parseInt(input);
        return showPagedCommands({ api, event, send, client, config, page });
      }

      let command = client.commands.get(input);

      if (!command) {
        for (const [name, cmd] of client.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(input)) {
            command = cmd;
            break;
          }
        }
      }

      if (!command) {
        return send.reply(`❌ Command "${input}" not found.`);
      }

      const cfg = command.config;
      return send.reply(`╭──────────────╮
    ✨ DETAILS ✨
╰──────────────╯

  ➲ Name: ${cfg.name.toUpperCase()}
  ➲ Desc: ${cfg.description || 'No description'}
  ➲ Usage: ${config.PREFIX}${cfg.usage || cfg.name}
  ➲ Alias: ${cfg.aliases?.join(', ') || 'None'}
  ➲ Cat  : ${cfg.category || 'Other'}
  ➲ Adm : ${cfg.adminOnly ? '✅' : '❌'}
  ➲ Gr : ${cfg.groupOnly ? '✅' : '❌'}

────────────────
   💡 Powered by ${config.BOTNAME}`);
    }

    return showDefaultHelp({ api, event, send, client, config });
  }
};

function showDefaultHelp({ api, event, send, client, config }) {
  const moment = require('moment-timezone');
  const time = moment().tz('Asia/Karachi').format('hh:mm A');
  const date = moment().tz('Asia/Karachi').format('DD/MM/YYYY');

  const helpingCommands = [
    { name: 'help', desc: 'Sari commands ki list dekho' },
    { name: 'rdxai', desc: 'Bot assistant se help lo' },
    { name: 'rankup', desc: 'Apna level aur rank dekho' },
    { name: 'daily', desc: 'Daily free coins claim karo' },
    { name: 'balance', desc: 'Wallet/Bank balance check karo' },
    { name: 'pair', desc: 'Love pair bnaein kisi sath' },
    { name: 'marry', desc: 'Apne partner se shadi karein' },
    { name: 'openaccount', desc: 'Bank account register karein' },
    { name: 'tiktok', desc: 'No watermark video download' },
    { name: 'uptime', desc: 'Bot running time check karein' }
  ];

  let msg = `┏╋━━━━◥◣◆◢◤━━━━╋┓
     👑 ${config.BOTNAME.toUpperCase()} MENU
┗╋━━━━◥◣◆◢◤━━━━╋┛\n
  ⌚ Time: ${time}
  📅 Date: ${date}
  ⚙️ Prefix: ${config.PREFIX}

 ────────────────\n`;

  helpingCommands.forEach((cmd, idx) => {
    msg += `  ${idx + 1}. [ ${config.PREFIX}${cmd.name} ]\n  ➲ ${cmd.desc}\n\n`;
  });

  msg += `────────────────
   💡 Use ${config.PREFIX}help all (Full List)
   👤 Owner: SARDAR RDX
────────────────`;

  return send.reply(msg);
}

function showPagedCommands({ api, event, send, client, config, page }) {
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  const commandsArray = Array.from(uniqueCommands.values());
  const commandsPerPage = 12;
  const totalPages = Math.ceil(commandsArray.length / commandsPerPage);

  if (page < 1 || page > totalPages) {
    return send.reply(`❌ Invalid page number.`);
  }

  const startIdx = (page - 1) * commandsPerPage;
  const endIdx = startIdx + commandsPerPage;
  const pageCommands = commandsArray.slice(startIdx, endIdx);

  let msg = `┏╋━━━━◥◣◆◢◤━━━━╋┓
      📚 HELP PAGE [${page}/${totalPages}]
┗╋━━━━◥◣◆◢◤━━━━╋┛\n\n`;

  pageCommands.forEach((cmd, idx) => {
    const num = startIdx + idx + 1;
    msg += `  💠 ${String(num).padStart(2, '0')}. ${config.PREFIX}${cmd.name}\n`;
  });

  msg += `\n  ────────────────
  💡 ${config.PREFIX}help [page]
  📖 ${config.PREFIX}help all
  ────────────────`;

  return send.reply(msg);
}

function showFullHelp({ api, event, send, client, config }) {
  const moment = require('moment-timezone');
  const categories = {};
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  for (const [name, cfg] of uniqueCommands) {
    const cat = cfg.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cfg);
  }

  const time = moment().tz('Asia/Karachi').format('hh:mm A');
  const date = moment().tz('Asia/Karachi').format('DD/MM/YYYY');

  let msg = `┏╋━━━━◥◣◆◢◤━━━━╋┓
     👑 ${config.BOTNAME.toUpperCase()} MENU
┗╋━━━━◥◣◆◢◤━━━━╋┛\n
  ⌚ Time: ${time}
  📅 Date: ${date}
  📊 Total: ${uniqueCommands.size} Commands
  ⚙️ Prefix: ${config.PREFIX}
 
  ────────────────\n`;

  const categoryOrder = ['Admin', 'Group', 'Economy', 'Media', 'Fun', 'Social', 'Utility', 'Love', 'Friend', 'Other'];

  const categoryEmojis = {
    'Admin': '👑',
    'Group': '👥',
    'Friend': '🤝',
    'Economy': '💰',
    'Media': '🎬',
    'Fun': '🎮',
    'Social': '�',
    'Utility': '🔧',
    'Love': '❤️',
    'Other': '📋'
  };

  const sortedCategories = Object.keys(categories).sort((a, b) => {
    const scoreA = categoryOrder.indexOf(a);
    const scoreB = categoryOrder.indexOf(b);
    if (scoreA !== -1 && scoreB !== -1) return scoreA - scoreB;
    if (scoreA !== -1) return -1;
    if (scoreB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const cat of sortedCategories) {
    const emoji = categoryEmojis[cat] || '📋';

    msg += `╭──────────────╮\n`;
    msg += `  ${emoji} ${cat.toUpperCase()}\n`;
    msg += `╰──────────────╯\n`;

    categories[cat].forEach(c => {
      msg += `  ➲ ${c.name}\n`;
    });
    msg += `\n`;
  }

  msg += `────────────────
   💡 Use ${config.PREFIX}help [cmd]
   👤 Owner: SARDAR RDX
────────────────`;

  return send.reply(msg);
}
