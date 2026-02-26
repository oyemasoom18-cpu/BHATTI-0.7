const UsersModel = require('../database/models/users');

class UsersController {
  constructor(api) {
    this.api = api;
    this.nameCache = new Map();
  }

  isValidName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') return false;
    const lower = name.toLowerCase().trim();
    const invalidNames = [
      'facebook', 
      'facebook user', 
      'user', 
      'unknown', 
      'undefined',
      'null',
      ''
    ];
    if (invalidNames.includes(lower)) return false;
    if (lower.includes('facebook user')) return false;
    return true;
  }

  async getNameUser(userID) {
    try {
      if (!userID) return 'User';
      
      const cachedMemory = this.nameCache.get(userID);
      if (this.isValidName(cachedMemory)) {
        return cachedMemory;
      }
      
      const cachedDB = UsersModel.getName(userID);
      if (this.isValidName(cachedDB)) {
        this.nameCache.set(userID, cachedDB);
        return cachedDB;
      }
      
      const info = await this.api.getUserInfo(userID);
      if (info && info[userID]) {
        const name = info[userID].name;
        const firstName = info[userID].firstName;
        const alternateName = info[userID].alternateName;
        
        if (this.isValidName(name)) {
          UsersModel.setName(userID, name);
          this.nameCache.set(userID, name);
          return name;
        }
        if (this.isValidName(firstName)) {
          UsersModel.setName(userID, firstName);
          this.nameCache.set(userID, firstName);
          return firstName;
        }
        if (this.isValidName(alternateName)) {
          UsersModel.setName(userID, alternateName);
          this.nameCache.set(userID, alternateName);
          return alternateName;
        }
      }
      
      try {
        const threadInfo = await this.api.getThreadInfo(userID);
        if (threadInfo && threadInfo.name && this.isValidName(threadInfo.name)) {
          UsersModel.setName(userID, threadInfo.name);
          this.nameCache.set(userID, threadInfo.name);
          return threadInfo.name;
        }
      } catch (e) {}
      
      if (this.isValidName(cachedDB)) return cachedDB;
      return 'User';
    } catch (error) {
      const cached = UsersModel.getName(userID);
      if (this.isValidName(cached)) return cached;
      return 'User';
    }
  }

  async refreshUserName(userID) {
    try {
      if (!userID) return null;
      
      const info = await this.api.getUserInfo(userID);
      if (info && info[userID]) {
        const name = info[userID].name;
        const firstName = info[userID].firstName;
        const alternateName = info[userID].alternateName;
        
        if (this.isValidName(name)) {
          UsersModel.setName(userID, name);
          this.nameCache.set(userID, name);
          return name;
        }
        if (this.isValidName(firstName)) {
          UsersModel.setName(userID, firstName);
          this.nameCache.set(userID, firstName);
          return firstName;
        }
        if (this.isValidName(alternateName)) {
          UsersModel.setName(userID, alternateName);
          this.nameCache.set(userID, alternateName);
          return alternateName;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async getValidName(userID, fallbackName = 'User') {
    const name = await this.getNameUser(userID);
    return this.isValidName(name) ? name : fallbackName;
  }

  setName(userID, name) {
    if (userID && this.isValidName(name)) {
      UsersModel.setName(userID, name);
      this.nameCache.set(userID, name);
      return true;
    }
    return false;
  }

  get(userID) {
    return UsersModel.get(userID);
  }

  create(userID, name = '') {
    return UsersModel.create(userID, name);
  }

  update(userID, data) {
    return UsersModel.update(userID, data);
  }

  ban(userID, reason = '') {
    return UsersModel.ban(userID, reason);
  }

  unban(userID) {
    return UsersModel.unban(userID);
  }

  isBanned(userID) {
    return UsersModel.isBanned(userID);
  }

  getAll() {
    return UsersModel.getAll();
  }

  getBanned() {
    return UsersModel.getAll().filter(u => u.banned === 1);
  }

  getData(userID) {
    return UsersModel.getData(userID);
  }

  setData(userID, data) {
    return UsersModel.setData(userID, data);
  }
}

module.exports = UsersController;
