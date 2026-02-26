const logs = require('../../utility/logs');

async function handleReaction({ api, event, config }) {
  const { threadID, messageID, userID, reaction } = event;
  
  if (!reaction) return;
  
  // Handle delete emoji reaction
  const deleteEmoji = config.REACT_DELETE_EMOJI || '😡';
  
  if (reaction === deleteEmoji) {
    try {
      const botID = api.getCurrentUserID();
      
      if (userID === botID) return;
      
      await api.unsendMessage(messageID);
      logs.info('REACTION', `Message deleted by reaction ${deleteEmoji} from ${userID}`);
    } catch (error) {
      logs.error('REACTION', 'Failed to delete message:', error.message);
    }
    return;
  }

  // Handle command-specific reactions
  if (!global.client.handleReaction) return;

  const reactionData = global.client.handleReaction.find(
    item => item.messageID === messageID
  );

  if (!reactionData) return;

  try {
    const command = global.client.commands.get(reactionData.name);

    if (!command || !command.handleReaction) return;

    const Users = require('../../system/controllers/users');
    const Threads = require('../../system/controllers/threads');

    await command.handleReaction({
      api,
      event,
      config,
      handleReaction: reactionData,
      Users,
      Threads
    });
  } catch (error) {
    console.error('Reaction Handler Error:', error);
  }
}

module.exports = handleReaction;