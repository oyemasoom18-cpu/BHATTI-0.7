module.exports = {
  async chargeUser(Currencies, userId, amount) {
    const data = await Currencies.getData(userId);
    const balance = Number(data.balance || 0);
    const bank = Number(data.bank || 0);
    const total = balance + bank;

    if (total < amount) {
      return { success: false, reason: 'insufficient', total };
    }

    if (balance >= amount) {
      await Currencies.removeBalance(userId, amount);
    } else {
      const needFromBank = amount - balance;
      const ok = await Currencies.withdraw(userId, needFromBank);
      if (!ok) return { success: false, reason: 'withdraw_failed', total };
      await Currencies.removeBalance(userId, amount);
    }

    const newData = await Currencies.getData(userId);
    const newBalance = Number(newData.balance || 0);
    const newBank = Number(newData.bank || 0);
    return { success: true, remaining: newBalance + newBank, balance: newBalance, bank: newBank };
  }
};
