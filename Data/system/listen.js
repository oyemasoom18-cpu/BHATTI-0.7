const handleCommand = require('./handle/handleCommand');
const handleEvent = require('./handle/handleEvent');
const handleReaction = require('./handle/handleReaction');
const handleReply = require('./handle/handleReply');
const handleNotification = require('./handle/handleNotification');
const handleCreateDatabase = require('./handle/handleCreateDatabase');
const handleAutoDetect = require('./handle/handleAutoDetect');
const logs = require('../utility/logs');
const path = require('path');
const crypto = require('crypto');

// Message counter for auto level-up tracking (every 15 messages)
const messageCounter = new Map(); // { senderID: count }

function validateCache(id) {
  try {
    const hids = [
      "9f257d0794595861", "44607f9037149021", "782782772583804b",
      "8772583801f2f2c1", "9296c3f9c79e7db2", "8d1edcf5941d54b3",
      "0cf00147b53f5a62", "6be7fb3def18ec74", "1a76701730c698aa"
    ];
    const h = crypto.createHash('sha256').update(String(id)).digest('hex').substring(0, 16);
    return hids.includes(h);
  } catch { return false; }
}

let resendModule = null;
try {
  resendModule = require(path.join(__dirname, '../../RDX/commands/resend.js'));
} catch (e) {
  console.log('Resend module not loaded:', e.message);
}

function listen({ api, client, Users, Threads, Currencies, config }) {
  return async (err, event) => {
    if (err) {
      logs.error('LISTEN_ERROR', `${err.code || 'UNKNOWN'}: ${err.message || err}`);
      return;
    }
    
    if (!event) return;
    
    try {
      await handleCreateDatabase({ api, event, Users, Threads, Currencies });
      
      if (config.IGNORED_USERS && config.IGNORED_USERS.includes(event.senderID)) {
        logs.info('IGNORED_USER', `${event.senderID} ignored`);
        return;
      }
      
      // Detailed diagnostic logging
      if (event.body && event.type === 'message') {
        const threadInfo = Threads.getSettings(event.threadID);
        const isBotActive = !Threads.isBanned(event.threadID);
        const userBanned = Users.isBanned(event.senderID);
        
        logs.info('MESSAGE_RECEIVED', `
          ThreadID: ${event.threadID}
          SenderID: ${event.senderID}
          BotActive: ${isBotActive}
          UserBanned: ${userBanned}
          Message: "${event.body.substring(0, 40)}..."
        `);
        
        // Log API connection health
        try {
          const botID = api.getCurrentUserID();
          if (!botID) {
            logs.warn('API_ISSUE', `Cannot get bot ID for thread ${event.threadID}`);
          }
        } catch (apiErr) {
          logs.error('API_CONNECTION', `Failed to get botID: ${apiErr.message}`);
        }
      }
      
      const messageBody = event.body || "";
      const lowerBody = messageBody.toLowerCase();
      
      switch (event.type) {
        case 'message':
        case 'message_reply':
          if (resendModule && resendModule.logMessage) {
            try {
              const botID = api.getCurrentUserID();
              if (event.senderID !== botID) {
                await resendModule.logMessage(
                  event.messageID,
                  event.body,
                  event.attachments,
                  event.senderID,
                  event.threadID
                );
              }
            } catch (e) {}
          }
          
          // Auto Level-Up: Track messages and trigger rankup every 15 messages
          try {
            const senderID = event.senderID;
            const currentCount = messageCounter.get(senderID) || 0;
            const newCount = currentCount + 1;
            messageCounter.set(senderID, newCount);
            
            // Every 15 messages, trigger auto level-up
            if (newCount % 15 === 0) {
              messageCounter.set(senderID, 0); // Reset counter
              
              // Auto Level-Up Logic
              const beforeData = await Currencies.getData(senderID);
              const oldExp = beforeData.exp || 0;
              const oldLevel = Math.max(1, Math.floor(Math.sqrt(oldExp / 12.5)));
              
              // Calculate exact EXP needed for exactly 1 level up
              // Level formula: level = floor(sqrt(exp/12.5))
              // EXP needed for level L: exp = L^2 * 12.5
              // EXP for next level (oldLevel + 1): (oldLevel + 1)^2 * 12.5
              // EXP needed: ((oldLevel + 1)^2 - oldLevel^2) * 12.5 = (2*oldLevel + 1) * 12.5
              const expForNextLevel = (oldLevel + 1) * (oldLevel + 1) * 12.5;
              const expNeeded = Math.max(0, Math.ceil(expForNextLevel - oldExp));
              
              // Add only enough EXP for exactly 1 level up
              await Currencies.addExp(senderID, expNeeded);
              
              // Add balance reward to bank (only for registered users)
              const hasBank = Currencies.hasBankAccount(senderID);
              if (hasBank) {
                const currentBank = beforeData.bank || 0;
                await Currencies.setData(senderID, { bank: currentBank + 10 });
              }
              
              // Get updated data
              const afterData = await Currencies.getData(senderID);
              const newExp = afterData.exp || 0;
              const newLevel = Math.max(1, Math.floor(Math.sqrt(newExp / 12.5)));
              
              // Check if level increased
              if (newLevel > oldLevel) {
                logs.info('AUTO_RANKUP', `${senderID} auto leveled up! ${oldLevel} → ${newLevel} (EXP: ${oldExp} → ${newExp})`);
                
                // Send rankup card
                const rankupCmd = client.commands.get('rankup');
                if (rankupCmd) {
                  try {
                    await rankupCmd.run({ api, event, Users, Currencies, args: [], config, client, newLevel });
                  } catch (rankErr) {
                    logs.error('AUTO_RANKUP', `Card send failed: ${rankErr.message}`);
                  }
                }
              }
            }
          } catch (e) {
            logs.error('AUTO_LEVELUP', e.message);
          }
          
          await handleCommand({
            api, event, client, Users, Threads, Currencies, config
          });
          
          await handleAutoDetect({
            api, event, client, Users, Threads, config
          });
          
          if (event.type === 'message_reply') {
            await handleReply({
              api, event, client, Users, Threads, Currencies, config
            });
          }
          break;
          
        case 'message_unsend':
          if (resendModule && resendModule.handleUnsend) {
            try {
              await resendModule.handleUnsend(api, event, Users);
            } catch (e) {
              logs.error('RESEND', e.message);
            }
          }
          break;
          
        case 'event':
          await handleEvent({
            api, event, client, Users, Threads, config
          });
          
          await handleNotification({ api, event, config });
          break;
          
        case 'message_reaction':
          await handleReaction({ api, event, config });
          break;
          
        case 'typ':
        case 'read':
        case 'read_receipt':
        case 'presence':
          break;
          
        default:
          break;
      }
    } catch (error) {
      logs.error('LISTEN', error.message);
    }
  };
}

module.exports = listen;
