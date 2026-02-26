const logs = require('../../utility/logs');

async function handleCreateDatabase({ api, event, Users, Threads, Currencies }) {
  const { threadID, senderID, isGroup } = event;
  
  try {
    if (senderID) {
      const user = Users.get(senderID);
      if (!user) {
        try {
          const userInfo = await api.getUserInfo(senderID);
          const name = userInfo[senderID]?.name || 'Unknown';
          Users.create(senderID, name);
        } catch (e) {
          Users.create(senderID);
        }
      }
      
      // Ensure currency data exists for user
      if (Currencies) {
        const currencyData = Currencies.get(senderID);
        if (!currencyData) {
          Currencies.create(senderID);
        }
      }
    }
    
    if (isGroup && threadID) {
      const thread = Threads.get(threadID);
      if (!thread) {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const name = threadInfo.threadName || threadInfo.name || '';
          Threads.create(threadID, name);
        } catch (e) {
          Threads.create(threadID);
        }
      }
    }
  } catch (error) {
    logs.error('DATABASE', error.message);
  }
}

module.exports = handleCreateDatabase;
