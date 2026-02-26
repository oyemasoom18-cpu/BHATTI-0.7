const logs = require('../../utility/logs');
const Send = require('../../utility/send');

async function handleReply({ api, event, client, Users, Threads, Currencies, config }) {
  const { threadID, senderID, messageID, messageReply } = event;

  if (!messageReply || !client.replies) return;

  const replyData = client.replies.get(messageReply.messageID);

  if (!replyData) return;

  const { commandName, author, data, callback } = replyData;

  // Convo Lockdown Check
  if (global.activeConvos && global.activeConvos.has(threadID) && commandName !== 'convo') {
    return; // Ignore replies to other commands during lockdown
  }

  if (replyData.author && senderID !== replyData.author) {
    return api.sendMessage('This reply is not for you.', threadID, messageID);
  }

  const command = client.commands.get(commandName);

  if (!command || !command.handleReply) return;

  const send = new Send(api, event);

  try {
    await command.handleReply({
      api,
      event,
      send,
      Users,
      Threads,
      config,
      client,
      Currencies,
      data,
      callback
    });
  } catch (error) {
    logs.error('REPLY', `Error in ${commandName}:`, error.message);
  }
}

module.exports = handleReply;
