const logs = require('./logs');

class Send {
  constructor(api, event) {
    this.api = api;
    this.event = event;
    this.threadID = event.threadID;
    this.messageID = event.messageID;
  }

  async _checkMembership(threadID) {
    try {
      if (!this.api || !this.api.getCurrentUserID) return { ok: true };
      const botID = this.api.getCurrentUserID();
      const info = await this.api.getThreadInfo(threadID).catch(() => null);
      if (!info) return { ok: false, reason: 'NO_THREAD_INFO' };
      if (info.isGroup && Array.isArray(info.participantIDs)) {
        if (!info.participantIDs.includes(botID)) {
          return { ok: false, reason: 'NOT_PARTICIPANT', botID };
        }
      }
      return { ok: true, info };
    } catch (e) {
      return { ok: false, reason: 'CHECK_FAILED', error: e };
    }
  }

  async _attemptSend(fn) {
    const MAX_RETRIES = 2;
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const res = await fn();
        return res;
      } catch (err) {
        const isTransient = err && (err.error === 1545012 || err.transientError || (err.errorSummary && err.errorSummary.toLowerCase().includes('temporary')));
        const notParticipant = err && (err.errorSummary && err.errorSummary.toLowerCase().includes('not part of the conversation'));
        if (notParticipant) {
          logs.warn('SEND', `Cannot send: bot not part of conversation ${this.threadID || 'unknown'}`);
          throw err;
        }
        if (!isTransient || attempt === MAX_RETRIES) {
          throw err;
        }
        attempt++;
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }

  async reply(message, callback) {
    const threadID = this.threadID;
    const membership = await this._checkMembership(threadID);
    if (!membership.ok) {
      logs.warn('SEND', `Reply prevented: ${membership.reason} for ${threadID}`);
      throw new Error(`Reply prevented: ${membership.reason}`);
    }

    return this._attemptSend(() => new Promise((resolve, reject) => {
      this.api.sendMessage(message, threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      }, this.messageID);
    }));
  }

  async send(message, threadID = this.threadID, callback) {
    const membership = await this._checkMembership(threadID);
    if (!membership.ok) {
      logs.warn('SEND', `Send prevented: ${membership.reason} for ${threadID}`);
      throw new Error(`Send prevented: ${membership.reason}`);
    }

    return this._attemptSend(() => new Promise((resolve, reject) => {
      this.api.sendMessage(message, threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      });
    }));
  }

  async reaction(emoji, messageID = this.messageID) {
    return new Promise((resolve, reject) => {
      this.api.setMessageReaction(emoji, messageID, (err) => {
        if (err) reject(err);
        else resolve(true);
      }, true);
    });
  }

  async unsend(messageID) {
    return new Promise((resolve, reject) => {
      this.api.unsendMessage(messageID, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async replyAndAutoUnsend(message, delay = 15000) {
    const info = await this.reply(message);
    setTimeout(() => {
      this.unsend(info.messageID).catch(() => {});
    }, delay);
    return info;
  }

  async shareContact(message, userID, callback) {
    const threadID = this.threadID;
    const membership = await this._checkMembership(threadID);
    if (!membership.ok) {
      logs.warn('SEND', `ShareContact prevented: ${membership.reason} for ${threadID}`);
      throw new Error(`ShareContact prevented: ${membership.reason}`);
    }

    return new Promise((resolve, reject) => {
      this.api.shareContact(message, userID, threadID, (err, info) => {
        if (err) reject(err);
        else {
          if (callback) callback(info);
          resolve(info);
        }
      }, this.messageID);
    });
  }
}

module.exports = Send;
