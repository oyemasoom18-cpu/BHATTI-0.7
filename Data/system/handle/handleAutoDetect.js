const logs = require('../../utility/logs');

async function handleAutoDetect({ api, event, client, Users, Threads, config }) {
    const { threadID, body, messageID } = event;
    
    if (!body) return;
    
    for (const [name, eventHandler] of client.events) {
        try {
            if (eventHandler.config.eventType !== 'message') continue;
            
            await eventHandler.run({
                api,
                event,
                Users,
                Threads,
                config,
                client
            });
        } catch (error) {
            logs.error('AUTO_DETECT', `Error in ${name}:`, error.message);
        }
    }
}

module.exports = handleAutoDetect;
