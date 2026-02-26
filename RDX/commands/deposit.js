module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'deposit',
    aliases: ['dep', 'save'],
    description: "Deposit coins from your wallet to your bank.",
    usage: 'deposit [amount/all]',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, args, send, Currencies, Users }) {
    const { senderID } = event;
    
    const name = await Users.getNameUser(senderID);
    const wallet = Currencies.getBalance(senderID);
    
    if (wallet <= 0) {
      return send.reply(`${name}, you have no money in your wallet to deposit!`);
    }
    
    let amount;
    
    if (args[0]?.toLowerCase() === 'all') {
      amount = wallet;
    } else {
      amount = parseInt(args[0]);
    }
    
    if (!amount || amount <= 0 || isNaN(amount)) {
      return send.reply('Please provide a valid amount to deposit.');
    }
    
    if (amount > wallet) {
      return send.reply(`${name}, you don't have enough money!\n\nWallet: ${wallet.toLocaleString()} Coins`);
    }
    
    const success = Currencies.deposit(senderID, amount);
    
    if (!success) {
      return send.reply('Failed to deposit money.');
    }
    
    const newWallet = Currencies.getBalance(senderID);
    const newBank = Currencies.getBank(senderID);
    
    return send.reply(`DEPOSIT SUCCESSFUL!
─────────────────
User: ${name}
Deposited: ${amount.toLocaleString()} Coins
─────────────────
Wallet: ${newWallet.toLocaleString()} Coins
Bank: ${newBank.toLocaleString()} Coins`);
  }
};

