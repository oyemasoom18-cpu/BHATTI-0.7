module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'sticker',
    aliases: ['stickerid', 'sid'],
    description: "Convert images to stickers or find stickers.",
    usage: 'sticker (reply to sticker)',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, send }) {
    const { messageReply } = event;
    
    if (!messageReply) {
      return send.reply('Please reply to a sticker with this command.');
    }
    
    const attachments = messageReply.attachments || [];
    
    if (attachments.length === 0) {
      return send.reply('No sticker found in the replied message.');
    }
    
    const sticker = attachments.find(a => a.type === 'sticker');
    
    if (!sticker) {
      return send.reply('The replied message does not contain a sticker.\n\nPlease reply to a sticker.');
    }
    
    const stickerID = sticker.stickerID || sticker.ID || sticker.id || 'Unknown';
    const packID = sticker.packID || 'Unknown';
    const spriteURI = sticker.spriteURI || sticker.url || 'N/A';
    const frameCount = sticker.frameCount || 1;
    const frameRate = sticker.frameRate || 0;
    
    return send.reply(`STICKER INFO
═══════════════════════
Sticker ID: ${stickerID}
Pack ID: ${packID}
Frames: ${frameCount}
Frame Rate: ${frameRate}
═══════════════════════
URL: ${spriteURI}
═══════════════════════

You can use this sticker ID to send this sticker programmatically.`);
  }
};

