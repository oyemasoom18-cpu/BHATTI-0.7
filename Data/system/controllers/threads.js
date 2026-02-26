const ThreadsModel = require('../database/models/threads');

class ThreadsController {
  constructor(api) {
    this.api = api;
  }

  async getInfo(threadID) {
    try {
      const info = await this.api.getThreadInfo(threadID);
      if (info) {
        ThreadsModel.setName(threadID, info.threadName || info.name || '');
      }
      return info;
    } catch (error) {
      return null;
    }
  }

  get(threadID) {
    return ThreadsModel.get(threadID);
  }

  create(threadID, name = '') {
    return ThreadsModel.create(threadID, name);
  }

  update(threadID, data) {
    return ThreadsModel.update(threadID, data);
  }

  approve(threadID) {
    return ThreadsModel.approve(threadID);
  }

  unapprove(threadID) {
    return ThreadsModel.unapprove(threadID);
  }

  isApproved(threadID) {
    return ThreadsModel.isApproved(threadID);
  }

  ban(threadID, reason = '') {
    return ThreadsModel.ban(threadID, reason);
  }

  unban(threadID) {
    return ThreadsModel.unban(threadID);
  }

  isBanned(threadID) {
    return ThreadsModel.isBanned(threadID);
  }

  getAll() {
    return ThreadsModel.getAll();
  }

  getApproved() {
    return ThreadsModel.getApproved();
  }

  getBanned() {
    return ThreadsModel.getAll().filter(t => t.banned === 1);
  }

  getSettings(threadID) {
    return ThreadsModel.getSettings(threadID);
  }

  setSettings(threadID, settings) {
    return ThreadsModel.setSettings(threadID, settings);
  }

  setSetting(threadID, key, value) {
    return ThreadsModel.setSettings(threadID, { [key]: value });
  }

  getData(threadID) {
    return ThreadsModel.getData(threadID);
  }

  setData(threadID, data) {
    return ThreadsModel.setData(threadID, data);
  }
}

module.exports = ThreadsController;
