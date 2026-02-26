module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'withdraw',
    aliases: ['wd', 'take'],
    description: "Withdraw coins from your bank to your wallet.",
    usage: 'withdraw [amount/all]',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, args, send, Currencies, Users }) {
    const { senderID } = event;
    
    const name = await Users.getNameUser(senderID);
    const bank = Currencies.getBank(senderID);
    
    if (bank <= 0) {
      return send.reply(`${name}, you have no money in your bank to withdraw!`);
    }
    
    let amount;
    
    if (args[0]?.toLowerCase() === 'all') {
      amount = bank;
    } else {
      amount = parseInt(args[0]);
    }
    
    if (!amount || amount <= 0 || isNaN(amount)) {
      return send.reply('Please provide a valid amount to withdraw.');
    }
    
    if (amount > bank) {
      return send.reply(`${name}, you don't have enough in bank!\n\nBank: ${bank.toLocaleString()} Coins`);
    }
    
    const success = Currencies.withdraw(senderID, amount);
    
    if (!success) {
      return send.reply('Failed to withdraw money.');
    }
    
    const newWallet = Currencies.getBalance(senderID);
    const newBank = Currencies.getBank(senderID);
    
    return send.reply(`WITHDRAWAL SUCCESSFUL!
─────────────────
User: ${name}
Withdrawn: ${amount.toLocaleString()} Coins
─────────────────
Wallet: ${newWallet.toLocaleString()} Coins
Bank: ${newBank.toLocaleString()} Coins`);
  }
};

