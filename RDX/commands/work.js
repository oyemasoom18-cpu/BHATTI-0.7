module.exports = {
  config: {
    name: 'work',
    aliases: ['job', 'earn'],
    description: "Work a random job to earn coins.",
    credits: "SARDAR RDX",
    usage: 'work',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, send, Currencies, Users }) {
    const { senderID } = event;
    
    const result = Currencies.work(senderID);
    const name = await Users.getNameUser(senderID);
    
    if (!result.success) {
      if (result.reason === 'no_bank_account') {
        return send.reply(
"┏━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ❌ ACCOUNT NEEDED!     ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n👤 Username: ${name}\n\n💡 Aapko pehle bank account banana hoga!\n💳 Open account ke liye: openaccount\n\n📥 Account open karein phir work kar sakte hain!\n━━━━━━━━━━━━━━━━━━━━".trim());
      }
      
      const mins = result.remaining;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      
      let timeText = '';
      if (hours > 0) {
        timeText = `${hours}h ${remainingMins}m`;
      } else {
        timeText = `${remainingMins}m`;
      }
      
      return send.reply(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  😴  THORA ARAM KARLO!    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 Username: ${name}
💬 Status: Busy 🏢

⏳ Rest Time Remaining:
   ⌛ ${timeText}

📍 Next work available in ${timeText}

💡 Tip: Ism dauraan aur kuch commands use karo!

┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`.trim());
    }
    
    const balance = Currencies.getBank(senderID);
    
    return send.reply(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ✅ WORK COMPLETED! 💼  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

👤 Worker: ${name}
🏢 Job Type: ${result.job}
⭐ Status: Completed ✔️

═════════════════════════════
💰 EARNINGS REPORT
═════════════════════════════
💵 Amount Earned: +${result.earnings} Coins 🎉
💳 New Total: ${balance} Coins
═════════════════════════════

📊 Work Stats:
  ✓ Job completed successfully
  ✓ Coins added to bank
  ✓ Next available: 30 minutes

🔔 Remember: Keep working to earn more! 🚀

┗━━━━━━━━━━━━━━━━━━━━━━━━━┛`.trim());
  }
};

