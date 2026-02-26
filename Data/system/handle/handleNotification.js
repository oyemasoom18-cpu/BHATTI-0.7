const logs = require('../../utility/logs');

async function handleNotification({ api, event, config }) {
  const { logMessageType, logMessageData, threadID } = event;
  const adminID = config.ADMINBOT[0];
  
  if (!adminID) return;
  
  try {
    if (logMessageType === 'log:subscribe') {
      const addedParticipants = logMessageData.addedParticipants || [];
      const botID = api.getCurrentUserID();
      const botAdded = addedParticipants.some(p => p.userFbId === botID);
      
      if (botAdded) {
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (e) {
          threadInfo = { threadName: 'Unknown Group' };
        }
        
        const groupName = threadInfo.threadName || 'Unknown Group';
        const memberCount = threadInfo.participantIDs?.length || 0;
        
        const message = `BOT ADDED TO NEW GROUP!
─────────────────
Group: ${groupName}
Thread ID: ${threadID}
Members: ${memberCount}
─────────────────
Use .approve ${threadID} to approve`;
        
        api.sendMessage(message, adminID);
        logs.info('NOTIFICATION', `Bot added to group: ${groupName} (${threadID})`);
      }
    }
    
    if (logMessageType === 'log:unsubscribe') {
      const leftParticipantFbId = logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();
      
      if (leftParticipantFbId === botID) {
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (e) {
          threadInfo = { threadName: 'Unknown Group' };
        }
        
        const groupName = threadInfo.threadName || 'Unknown Group';
        
        const message = `BOT REMOVED FROM GROUP!
─────────────────
Group: ${groupName}
Thread ID: ${threadID}
─────────────────`;
        
        api.sendMessage(message, adminID);
        logs.info('NOTIFICATION', `Bot removed from group: ${groupName} (${threadID})`);
      }
    }
  } catch (error) {
    logs.error('NOTIFICATION', error.message);
  }
}

module.exports = handleNotification;
