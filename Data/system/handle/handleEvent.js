const logs = require('../../utility/logs');
const Send = require('../../utility/send');

async function handleEvent({ api, event, client, Users, Threads, config }) {
  const { threadID, logMessageType, logMessageData, logMessageBody } = event;
  
  if (!logMessageType) return;
  
  logs.event(logMessageType, threadID);
  
  for (const [name, eventHandler] of client.events) {
    try {
      if (eventHandler.config.eventType) {
        if (Array.isArray(eventHandler.config.eventType)) {
          if (!eventHandler.config.eventType.includes(logMessageType)) continue;
        } else if (eventHandler.config.eventType !== logMessageType) {
          continue;
        }
      }
      
      const send = new Send(api, event);
      
      await eventHandler.run({
        api,
        event,
        send,
        Users,
        Threads,
        config,
        client,
        logMessageType,
        logMessageData,
        logMessageBody
      });
    } catch (error) {
      logs.error('EVENT', `Error in ${name}:`, error.message);
    }
  }
}

module.exports = handleEvent;
