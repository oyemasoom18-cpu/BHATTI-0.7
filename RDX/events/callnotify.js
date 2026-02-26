module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'callnotify',
    eventType: 'event',
    description: 'Notify about calls'
  },
  
  async run({ api, event, send, config }) {
    if (event.logMessageType !== 'log:call') return;
    
    const { threadID, logMessageData } = event;
    const adminID = config.ADMINBOT[0];
    
    if (!adminID) return;
    
    const callType = logMessageData.event === 'group_call_started' ? 'started' : 
                     logMessageData.event === 'group_call_ended' ? 'ended' : null;
    
    if (callType) {
      let threadInfo;
      try {
        threadInfo = await api.getThreadInfo(threadID);
      } catch {
        threadInfo = { threadName: 'Unknown Group' };
      }
      
      const groupName = threadInfo.threadName || 'Unknown Group';
      
      api.sendMessage(`📞 CALL ${callType.toUpperCase()}
─────────────────
Group: ${groupName}
Thread ID: ${threadID}`, adminID);
    }
  }
};

