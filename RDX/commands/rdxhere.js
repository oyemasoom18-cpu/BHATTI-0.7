const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "rdxhere",
        credits: "SARDAR RDX",
        description: "Flood group with messages and auto-add helper UIDs",
        usage: "rdxhere",
        category: "Admin",
        adminOnly: true,
        prefix: true
    },

    async run({ api, event, send, config }) {
        const { threadID, messageID, senderID } = event;

        // 🕵️ Admin Check
        if (!config.ADMINBOT.includes(senderID)) {
            return send.reply("❌ **𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝:** Sirf Bot Admins hi ye command use kr skty hain! 👮");
        }

        const messages = [
            "BUHT HO GAEY BACKCHODI 🌚",
            "YATEMO AP KA PAPA AGYA 🙋‍♂️🖤 ",
            "KOI POCHY TO BTANA SARDAR RDX AYA THA CHODNY 🙂🫰",
            "Khush rho enjoy kro chutiyo 🤏"
        ];

        const usersToAdd = [
            "61582862311675",
            "61582915079134",
            "61582448566237",
            "61583038793097",
            "61582740037285",
            "61583077011427",
            "61582528696444"
        ];

        try {
            // 🚀 Start Sequence
            await send.send(`╔══════════════════╗\n   🏁 **𝐇𝐀𝐂𝐊 𝐒𝐄𝐐𝐔𝐄𝐍𝐂𝐄** 🏁\n╚══════════════════╝\n\nInitializing RDX-HERE protocol... 🦅`);

            // 1. Send Flood Messages
            for (const msg of messages) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await api.sendMessage(msg, threadID);
            }

            // 2. Add Users with Status Updates
            await api.sendMessage("┏╋━━━━◥◣◆◢◤━━━━╋┓\n   ➕ **𝐀𝐃𝐃𝐈𝐍𝐆 𝐔𝐒𝐄𝐑𝐒** ➕\n┗╋━━━━◥◣◆◢◤━━━━╋┛", threadID);

            let addedCount = 0;
            let failedCount = 0;

            for (let i = 0; i < usersToAdd.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                    await api.addUserToGroup(usersToAdd[i], threadID);
                    addedCount++;
                    await api.sendMessage(`✅ **𝐒𝐔𝐂𝐂𝐄𝐒𝐒:** Added User ${i + 1}/${usersToAdd.length}`, threadID);
                } catch (error) {
                    failedCount++;
                    console.log(`Failed to add ${usersToAdd[i]}:`, error.message);
                    await api.sendMessage(`❌ **𝐅𝐀𝐈𝐋𝐄𝐃:** Could not add User ${i + 1}`, threadID);
                }
            }

            // 🏁 Final Summary
            const summary = `╔══════════════════╗\n   ✅ **𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄𝐃** ✅\n╚══════════════════╝\n\n📊 **𝐑𝐄𝐒𝐔𝐋𝐓𝐒:**\n──────────────────\n✅ Added: ${addedCount}\n❌ Failed: ${failedCount}\n──────────────────\n🦅 **𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 𝐖𝐀𝐒 𝐇𝐄𝐑𝐄** 🦅`;

            await api.sendMessage(summary, threadID);

        } catch (error) {
            console.error("rdxhere error:", error);
            return send.reply(`❌ **𝐄𝐑𝐑𝐎𝐑:** Protocol interrupted: ${error.message}`);
        }
    }
};
