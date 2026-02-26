const db = require('../index');

const Users = {
  getAll() {
    return db.prepare('SELECT * FROM users').all();
  },

  get(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  create(id, name = '') {
    const existing = this.get(id);
    if (existing) return existing;

    db.prepare('INSERT INTO users (id, name) VALUES (?, ?)').run(id, name);
    return this.get(id);
  },

  update(id, data) {
    const user = this.get(id);
    if (!user) this.create(id);

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }

    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  },

  setName(id, name) {
    return this.update(id, { name });
  },

  getName(id) {
    const user = this.get(id);
    return user?.name || 'Unknown';
  },

  ban(id, reason = '') {
    return this.update(id, { banned: 1, banReason: reason });
  },

  unban(id) {
    return this.update(id, { banned: 0, banReason: '' });
  },

  isBanned(id) {
    const user = this.get(id);
    return user?.banned === 1;
  },

  addExp(id, amount) {
    const user = this.get(id) || this.create(id);
    this.update(id, { exp: (user.exp || 0) + amount });
    // Sync with Currencies model
    try {
      const Currencies = require('./currencies');
      Currencies.addExp(id, amount);
    } catch (e) { }
    return this.get(id);
  },

  addMoney(id, amount) {
    const user = this.get(id) || this.create(id);
    this.update(id, { money: (user.money || 0) + amount });
    // Sync with Currencies model
    try {
      const Currencies = require('./currencies');
      Currencies.addBalance(id, amount);
    } catch (e) { }
    return this.get(id);
  },

  getData(id) {
    const user = this.get(id);
    try {
      return JSON.parse(user?.data || '{}');
    } catch {
      return {};
    }
  },

  setData(id, data) {
    return this.update(id, { data: JSON.stringify(data) });
  }
};

module.exports = Users;
