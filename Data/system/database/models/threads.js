const db = require('../index');

const Threads = {
  getAll() {
    return db.prepare('SELECT * FROM threads').all();
  },

  get(id) {
    return db.prepare('SELECT * FROM threads WHERE id = ?').get(id);
  },

  create(id, name = '') {
    const existing = this.get(id);
    if (existing) return existing;
    
    db.prepare('INSERT INTO threads (id, name) VALUES (?, ?)').run(id, name);
    return this.get(id);
  },

  update(id, data) {
    const thread = this.get(id);
    if (!thread) this.create(id);
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    values.push(id);
    db.prepare(`UPDATE threads SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.get(id);
  },

  setName(id, name) {
    return this.update(id, { name });
  },

  approve(id) {
    return this.update(id, { approved: 1 });
  },

  unapprove(id) {
    return this.update(id, { approved: 0 });
  },

  isApproved(id) {
    const thread = this.get(id);
    return thread?.approved === 1;
  },

  ban(id, reason = '') {
    return this.update(id, { banned: 1, banReason: reason });
  },

  unban(id) {
    return this.update(id, { banned: 0, banReason: '' });
  },

  isBanned(id) {
    const thread = this.get(id);
    return thread?.banned === 1;
  },

  getApproved() {
    return db.prepare('SELECT * FROM threads WHERE approved = 1').all();
  },

  getSettings(id) {
    const thread = this.get(id);
    try {
      return JSON.parse(thread?.settings || '{}');
    } catch {
      return {};
    }
  },

  setSettings(id, settings) {
    const current = this.getSettings(id);
    return this.update(id, { settings: JSON.stringify({ ...current, ...settings }) });
  },

  getData(id) {
    const thread = this.get(id);
    try {
      return JSON.parse(thread?.data || '{}');
    } catch {
      return {};
    }
  },

  setData(id, data) {
    return this.update(id, { data: JSON.stringify(data) });
  }
};

module.exports = Threads;
