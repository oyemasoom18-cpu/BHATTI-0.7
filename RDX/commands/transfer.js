module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'transfer',
    aliases: ['pay', 'give', 'send'],
    description: "Send coins to another user securely.",
    usage: 'transfer @user [amount]',
    category: 'Economy',
    prefix: true
  },

  async run({ api, event, args, send, Currencies, Users }) {
    const { senderID, mentions } = event;

    let targetID = '';
    let amount = 0;

    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      amount = parseInt(args[args.length - 1]);
    } else if (event.messageReply) {
      targetID = event.messageReply.senderID;
      amount = parseInt(args[0]);
    } else if (args.length >= 2 && /^\d+$/.test(args[0])) {
      targetID = args[0];
      amount = parseInt(args[1]);
    } else {
      return send.reply('Usage: transfer @user [amount] or reply to a message with amount');
    }

    if (targetID === senderID) {
      return send.reply("You can't transfer money to yourself!");
    }

    if (!amount || amount <= 0 || isNaN(amount)) {
      return send.reply('Please provide a valid amount to transfer.');
    }

    const senderName = await Users.getNameUser(senderID);
    const wallet = Currencies.getBalance(senderID);

    if (amount > wallet) {
      return send.reply(`${senderName}, you don't have enough money!\n\nWallet: ${wallet.toLocaleString()} Coins`);
    }

    const success = Currencies.transfer(senderID, targetID, amount);

    if (!success) {
      return send.reply('Failed to transfer money.');
    }

    const targetName = await Users.getNameUser(targetID);
    const newBalance = Currencies.getBalance(senderID);

    return send.reply(`╔══════════════════════════╗
   💸 𝗧𝗥𝗔𝗡𝗦𝗙𝗘𝗥 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 💸
╚══════════════════════════╝

👤 𝗙𝗿𝗼𝗺:
   ${senderName}

👥 𝗧𝗼:
   ${targetName}

💰 𝗔𝗺𝗼𝘂𝗻𝘁:
   ${amount.toLocaleString()} Coins

────────────────────
💳 𝗬𝗼𝘂𝗿 𝗕𝗮𝗹𝗮𝗻𝗰𝗲:
   ${newBalance.toLocaleString()} Coins
────────────────────

✨ Transfer complete!`);
  }
};
