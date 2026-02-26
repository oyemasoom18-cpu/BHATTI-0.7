const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "myaccount",
    aliases: ["mybank", "accmanage"],
    description: "Manage your bank account details",
    usage: "myaccount",
    category: "Economy",
    prefix: true
  },

  async run({ api, event, send, Currencies }) {
    const { senderID, threadID, messageID } = event;
    const db = require('../../Data/system/database/index.js');
    
    const bankData = db.prepare('SELECT * FROM bank_system WHERE userId = ?').get(senderID);

    if (!bankData || !bankData.account_number) {
      return send.reply("❌ Aapka bank account nahi bana hua. Pehle account banayein!");
    }

    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    const avatarPath = path.join(cacheDir, `avatar_${senderID}.png`);

    try {
      const avatarURL = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      await fs.writeFile(avatarPath, Buffer.from(response.data));
    } catch (e) {}

    const msg = `
🏦 ━━━ 𝐌𝐘 𝐀𝐂𝐂𝐎𝐔𝐍𝐓 ━━━ 🏦
──────────────────
🆔 𝑩𝒂𝒏𝒌 𝑨𝒄𝒄𝒐𝒖𝒏𝒕: \\\`${bankData.account_number}\\\`
👤 𝑭𝒖𝒍𝒍 𝑵𝒂𝒎𝒆: ${bankData.full_name}
👴 𝑭𝒂𝒕𝒉𝒆𝒓 𝑵𝒂𝒎𝒆: ${bankData.father_name}
🎂 𝑼𝒔𝒆𝒓 𝑨𝒈𝒆: ${bankData.age}
🏙️ 𝑪𝒖𝒓𝒓𝒆𝒏𝒕 𝑪𝒊𝒕𝒚: ${bankData.city}
💰 𝑩𝒂𝒏𝒌 𝑩𝒂𝒍𝒂𝒏𝒄𝒆: ${bankData.bank_balance.toLocaleString()} Coins
──────────────────
📝 𝐌𝐀𝐍𝐀𝐆𝐄 𝐎𝐏𝐓𝐈𝐎𝐍𝐒:
𝟏. Edit My Details (Name, Father, City)
𝟐. Remove My Account (Permanent Delete)

Reply with number to select an option.`.trim();

    const msgObj = { body: msg };
    if (fs.existsSync(avatarPath)) {
      msgObj.attachment = fs.createReadStream(avatarPath);
    }

    api.sendMessage(msgObj, threadID, (err, info) => {
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      if (info) {
        if (!global.client.replies) global.client.replies = new Map();
        global.client.replies.set(info.messageID, {
          commandName: 'myaccount',
          author: senderID,
          type: 'main_menu'
        });
      }
    }, messageID);
  },

  handleReply: async function ({ api, event, send, Currencies, handleReply }) {
    const { body, senderID, threadID, messageReply, messageID } = event;
    
    // Check if global objects are ready
    if (!global.client) global.client = {};
    if (!global.client.replies) global.client.replies = new Map();

    if (!messageReply || !global.client.replies.has(messageReply.messageID)) return;

    const replyData = global.client.replies.get(messageReply.messageID);
    if (replyData.commandName !== 'myaccount' || replyData.author !== senderID) return;

    const db = require('../../Data/system/database/index.js');

    // Menu logic
    if (replyData.type === 'main_menu') {
      if (body.trim() == '1') {
        api.sendMessage("📝 𝐄𝐃𝐈𝐓 𝐃𝐄𝐓𝐀𝐈𝐋𝐒\n\nReply with new details in this format:\nName | Father Name | City\n\nExample: Ali | Ahmed | Karachi", threadID, (err, info) => {
          if (info) {
            global.client.replies.set(info.messageID, {
              commandName: 'myaccount',
              author: senderID,
              type: 'edit_details'
            });
          }
        }, messageID);
      } else if (body.trim() == '2') {
        api.sendMessage("⚠️ 𝐖𝐀𝐑𝐍𝐈𝐍𝐆!\nAap apna bank account mukammal tor par delete karne ja rahe hain. Saara data aur balance khatam ho jayega.\n\nType 'CONFIRM' to delete.", threadID, (err, info) => {
          if (info) {
            global.client.replies.set(info.messageID, {
              commandName: 'myaccount',
              author: senderID,
              type: 'confirm_delete'
            });
          }
        }, messageID);
      }
      return;
    }

    // Detail update logic
    if (replyData.type === 'edit_details') {
      const parts = body.split('|').map(p => p.trim());
      if (parts.length < 3) return api.sendMessage("❌ Invalid format. Please use: Name | Father Name | City", threadID, messageID);

      db.prepare('UPDATE bank_system SET full_name = ?, father_name = ?, city = ? WHERE userId = ?')
        .run(parts[0], parts[1], parts[2], senderID);

      return api.sendMessage(`✅ **Details updated successfully!**\n👤 Name: ${parts[0]}\n👴 Father: ${parts[1]}\n🏙️ City: ${parts[2]}`, threadID, messageID);
    }

    // Delete logic
    if (replyData.type === 'confirm_delete') {
      if (body.toUpperCase().trim() === 'CONFIRM') {
        const statusMsg = await api.sendMessage("⏳ Processing... Aapka account aur saara progress database se clear kiya ja raha hai.", threadID);
        
        // Artificial delay for thoroughness
        await new Promise(resolve => setTimeout(resolve, 2000));

        db.prepare('DELETE FROM bank_system WHERE userId = ?').run(senderID);
        // Also clear user currency/data and level (exp) to start from zero
        if (typeof Currencies !== 'undefined' && Currencies.setData) {
          await Currencies.setData(senderID, { 
            balance: 0,
            bank: 0,
            exp: 0
          });
        }
        
        // Ensure global user data/exp is cleared
        try {
           db.prepare('UPDATE currencies SET exp = 0, balance = 0, bank = 0 WHERE id = ?').run(senderID);
        } catch (e) {}

        return api.editMessage("🚮 Aapka bank account database se mukammal tor par delete kar diya gaya hai. Ab aap zero se start karein ge (Level aur Balance dono zero ho gaye hain).", statusMsg.messageID);
      } else {
        return api.sendMessage("❌ Delete process cancel kar diya gaya.", threadID, messageID);
      }
    }
  }
};

