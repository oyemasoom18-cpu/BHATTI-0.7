const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const botStickers = [
  "https://i.ibb.co/fYpfBQj/sticker1.png",
  "https://i.ibb.co/k6RwZqw/sticker2.png",
  "https://i.ibb.co/XsL3NqR/sticker3.png"
];

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'botsticker',
    aliases: ['bsticker', 'botreact'],
    description: "Get custom bot-themed stickers for 'bot' word",
    usage: 'botsticker [on/off/send]',
    category: 'Fun',
    prefix: true
  },

  onMessage: async function ({ api, event, Threads, config }) {
    const { threadID, body, senderID } = event;

    if (!body) return;

    const settings = Threads.getSettings(threadID);
    if (!settings.botsticker) return;

    const botWords = ['bot', 'goi', 'baby', 'sardar'];
    const lowerBody = body.toLowerCase();

    const hasWord = botWords.some(word =>
      lowerBody === word ||
      lowerBody.startsWith(word + ' ') ||
      lowerBody.endsWith(' ' + word) ||
      lowerBody.includes(' ' + word + ' ')
    );

    if (!hasWord) return;

    try {
      const stickerApis = [
        'https://api.tenor.com/v1/random?q=cute+anime+reaction&key=LIVDSRZULELA&limit=1',
        'https://api.tenor.com/v1/random?q=kawaii+sticker&key=LIVDSRZULELA&limit=1'
      ];

      const randomApi = stickerApis[Math.floor(Math.random() * stickerApis.length)];
      const response = await axios.get(randomApi, { timeout: 10000 });

      if (response.data.results && response.data.results.length > 0) {
        const gifUrl = response.data.results[0].media[0].gif.url;

        const cacheDir = path.join(__dirname, 'cache');
        fs.ensureDirSync(cacheDir);

        const stickerPath = path.join(cacheDir, `botsticker_${Date.now()}.gif`);

        const gifRes = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(stickerPath, Buffer.from(gifRes.data));

        await api.sendMessage({
          attachment: fs.createReadStream(stickerPath)
        }, threadID);

        setTimeout(() => {
          try { fs.unlinkSync(stickerPath); } catch { }
        }, 10000);
      }
    } catch (error) {
      console.log('Bot sticker error:', error.message);
    }
  },

  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;

    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);

    const action = args[0]?.toLowerCase();
    const settings = Threads.getSettings(threadID);

    if (!action || action === 'status') {
      return send.reply(`Bot Sticker Status
─────────────────
Status: ${settings.botsticker ? 'ON' : 'OFF'}

Bot will send random sticker when someone says "bot", "goi", "baby", or "sardar".

Usage:
- botsticker on
- botsticker off
- botsticker send (to send a sticker now)`);
    }

    if (action === 'send' || action === 'now') {
      try {
        const response = await axios.get('https://api.tenor.com/v1/random?q=cute+reaction&key=LIVDSRZULELA&limit=1', { timeout: 10000 });

        if (response.data.results && response.data.results.length > 0) {
          const gifUrl = response.data.results[0].media[0].gif.url;

          const cacheDir = path.join(__dirname, 'cache');
          fs.ensureDirSync(cacheDir);

          const stickerPath = path.join(cacheDir, `botsticker_${Date.now()}.gif`);

          const gifRes = await axios.get(gifUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(stickerPath, Buffer.from(gifRes.data));

          await api.sendMessage({
            attachment: fs.createReadStream(stickerPath)
          }, threadID);

          setTimeout(() => {
            try { fs.unlinkSync(stickerPath); } catch { }
          }, 10000);
        }
      } catch (error) {
        return send.reply('Failed to send sticker: ' + error.message);
      }
      return;
    }

    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only admins can toggle bot sticker.');
    }

    if (action === 'on' || action === 'enable') {
      Threads.setSettings(threadID, { botsticker: true });
      return send.reply('Bot sticker enabled.\n\nBot will react with stickers when someone says "bot", "goi", "baby", or "sardar".');
    }

    if (action === 'off' || action === 'disable') {
      Threads.setSettings(threadID, { botsticker: false });
      return send.reply('Bot sticker disabled.');
    }

    return send.reply('Usage: botsticker [on/off/send]');
  }
};

