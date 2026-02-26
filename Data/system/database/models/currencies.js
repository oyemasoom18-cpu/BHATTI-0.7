const db = require('../index');

const Currencies = {
  get(id) {
    const db = require('../index');
    return db.prepare('SELECT * FROM currencies WHERE id = ?').get(id);
  },

  getBankData(id) {
    const db = require('../index');
    return db.prepare('SELECT * FROM bank_system WHERE userId = ?').get(id);
  },

  hasBankAccount(id) {
    const bankData = this.getBankData(id);
    return bankData && bankData.registration_step >= 1;
  },

  updateRegistrationStep(id, step, data = {}) {
    const db = require('../index');
    const existing = this.getBankData(id);

    if (!existing) {
      db.prepare('INSERT INTO bank_system (userId, created_at) VALUES (?, ?)').run(id, new Date().toISOString());
    }

    const fields = ['registration_step = ?'];
    const values = [step];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    values.push(id);
    db.prepare(`UPDATE bank_system SET ${fields.join(', ')} WHERE userId = ?`).run(...values);

    // Sync bank_balance to currencies if it was updated
    if (typeof data.bank_balance !== 'undefined') {
      const currency = this.get(id) || this.create(id);
      this.update(id, { bank: data.bank_balance });
    }
  },

  create(id) {
    const existing = this.get(id);
    if (existing) return existing;

    db.prepare('INSERT INTO currencies (id) VALUES (?)').run(id);
    return this.get(id);
  },

  update(id, data) {
    const currency = this.get(id);
    if (!currency) this.create(id);

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }

    values.push(id);
    db.prepare(`UPDATE currencies SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  },

  getBalance(id) {
    const currency = this.get(id) || this.create(id);
    return currency.balance || 0;
  },

  getBank(id) {
    const currency = this.get(id) || this.create(id);
    return currency.bank || 0;
  },

  getTotal(id) {
    const currency = this.get(id) || this.create(id);
    return (currency.balance || 0) + (currency.bank || 0);
  },

  addBalance(id, amount) {
    const currency = this.get(id) || this.create(id);
    return this.update(id, { balance: (currency.balance || 0) + amount });
  },

  removeBalance(id, amount) {
    const currency = this.get(id) || this.create(id);
    const newBalance = Math.max(0, (currency.balance || 0) - amount);
    return this.update(id, { balance: newBalance });
  },

  deposit(id, amount) {
    const currency = this.get(id) || this.create(id);
    if ((currency.balance || 0) < amount) return false;

    this.update(id, {
      balance: (currency.balance || 0) - amount,
      bank: (currency.bank || 0) + amount
    });

    // Sync with bank_system if exists
    try {
      db.prepare('UPDATE bank_system SET bank_balance = bank_balance + ? WHERE userId = ?').run(amount, id);
    } catch (e) { }

    return true;
  },

  withdraw(id, amount) {
    const currency = this.get(id) || this.create(id);
    if ((currency.bank || 0) < amount) return false;

    this.update(id, {
      balance: (currency.balance || 0) + amount,
      bank: (currency.bank || 0) - amount
    });

    // Sync with bank_system if exists
    try {
      db.prepare('UPDATE bank_system SET bank_balance = bank_balance - ? WHERE userId = ?').run(amount, id);
    } catch (e) { }

    return true;
  },

  transfer(fromId, toId, amount) {
    const from = this.get(fromId) || this.create(fromId);
    if ((from.balance || 0) < amount) return false;

    this.create(toId);
    this.removeBalance(fromId, amount);
    this.addBalance(toId, amount);
    return true;
  },

  claimDaily(id) {
    const currency = this.get(id) || this.create(id);
    const now = new Date().toDateString();
    const lastDaily = currency.lastDaily;

    // Only registered users can claim daily
    const hasBank = this.hasBankAccount(id);
    if (!hasBank) {
      return { success: false, reason: 'no_bank_account' };
    }

    if (lastDaily === now) {
      return { success: false, reason: 'already_claimed' };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastDaily === yesterday.toDateString();

    let streak = wasYesterday ? (currency.dailyStreak || 0) + 1 : 1;
    const reward = 10;

    this.update(id, {
      bank: (currency.bank || 0) + reward,
      dailyStreak: streak,
      lastDaily: now
    });

    return { success: true, reward, streak };
  },

  work(id) {
    const currency = this.get(id) || this.create(id);
    const now = Date.now();
    const lastWork = currency.lastWork ? new Date(currency.lastWork).getTime() : 0;
    const cooldown = 30 * 60 * 1000;

    if (now - lastWork < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastWork)) / 60000);
      return { success: false, remaining };
    }

    // Only registered users can work
    const hasBank = this.hasBankAccount(id);
    if (!hasBank) {
      return { success: false, reason: 'no_bank_account' };
    }

    const jobs = ['Developer', 'Teacher', 'Doctor', 'Driver', 'Chef', 'Artist', 'Engineer', 'Writer'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earnings = 10;

    this.update(id, {
      bank: (currency.bank || 0) + earnings,
      lastWork: new Date().toISOString()
    });

    return { success: true, job, earnings };
  },

  getTop(limit = 10) {
    return db.prepare(`
      SELECT id, balance, bank, (balance + bank) as total 
      FROM currencies 
      ORDER BY total DESC 
      LIMIT ?
    `).all(limit);
  },

  addTransaction(id, type, amount, note = '') {
    const currency = this.get(id) || this.create(id);
    let transactions = [];
    try {
      transactions = JSON.parse(currency.transactions || '[]');
    } catch { }

    transactions.unshift({
      type,
      amount,
      note,
      timestamp: new Date().toISOString()
    });

    transactions = transactions.slice(0, 50);
    return this.update(id, { transactions: JSON.stringify(transactions) });
  },

  getData(id) {
    const currency = this.get(id) || this.create(id);
    return {
      exp: currency.exp || 0,
      balance: currency.balance || 0,
      bank: currency.bank || 0
    };
  },

  setData(id, data) {
    const currency = this.get(id) || this.create(id);
    const updateData = {};

    if (typeof data.exp !== 'undefined') {
      updateData.exp = data.exp;
    }
    if (typeof data.balance !== 'undefined') {
      updateData.balance = data.balance;
    }
    if (typeof data.bank !== 'undefined') {
      updateData.bank = data.bank;
    }

    if (Object.keys(updateData).length > 0) {
      return this.update(id, updateData);
    }
    return currency;
  },

  getExp(id) {
    const currency = this.get(id) || this.create(id);
    return currency.exp || 0;
  },

  addExp(id, amount) {
    const currency = this.get(id) || this.create(id);
    return this.update(id, { exp: (currency.exp || 0) + amount });
  },

  // Reset all user data
  resetAllData() {
    try {
      db.prepare('DELETE FROM currencies').run();
      db.prepare('DELETE FROM bank_system').run();
      return { success: true, message: 'All user data cleared' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get all users count
  getAllCount() {
    const result = db.prepare('SELECT COUNT(*) as count FROM currencies').get();
    return result.count || 0;
  },

  resetCoinsAtMidnight() {
    try {
      // Get all users without bank accounts
      const usersWithoutBank = db.prepare(`
        SELECT c.id FROM currencies c 
        LEFT JOIN bank_system b ON c.id = b.userId 
        WHERE b.userId IS NULL
      `).all();

      let resetCount = 0;
      for (const user of usersWithoutBank) {
        db.prepare('UPDATE currencies SET balance = 0 WHERE id = ?').run(user.id);
        resetCount++;
      }

      return { success: true, resetCount, message: `Reset coins for ${resetCount} users without bank accounts` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  dailyMidnightReset() {
    try {
      db.prepare('UPDATE currencies SET exp = 0').run();
      db.prepare('UPDATE users SET exp = 0').run();
      return { success: true, message: 'Daily rankup scores (EXP) have been reset for all users across both tables.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = Currencies;
