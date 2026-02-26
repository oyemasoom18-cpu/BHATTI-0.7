module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'balance',
    aliases: ['bal', 'money', 'wallet'],
    description: "Check your wallet and bank balance.",
    usage: 'balance [@user]',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, args, send, Currencies, Users }) {
    const { senderID, mentions } = event;
    
    let uid = senderID;
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    }
    
    const name = await Users.getNameUser(uid);
    const wallet = Currencies.getBalance(uid);
    const bank = Currencies.getBank(uid);
    const total = Currencies.getTotal(uid);
    
    return send.reply(`BALANCE CHECK
─────────────────
User: ${name}
─────────────────
Wallet: ${wallet.toLocaleString()} Coins
Bank: ${bank.toLocaleString()} Coins
─────────────────
Total: ${total.toLocaleString()} Coins`);
  }
};

