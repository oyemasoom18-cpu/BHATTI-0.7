module.exports = {
    config: {
        name: 'convoNameLock',
        eventType: ['log:thread-name'],
        credits: "SARDAR RDX",
        description: 'Auto-revert group name if changed during an active convolution'
    },

    async run({ api, event, client, Threads }) {
        const { threadID, author, logMessageData } = event;
        const botID = api.getCurrentUserID();

        // ⛔ Ignore if the change was made by the bot itself
        if (author === botID) return;

        // 🔍 Check if there's an active convo with a locked name in this group
        if (global.activeConvos && global.activeConvos.has(threadID)) {
            const active = global.activeConvos.get(threadID);

            if (active.lockedName) {
                const newName = logMessageData.name;

                if (newName !== active.lockedName) {
                    try {
                        // Restore original name
                        await api.setTitle(active.lockedName, threadID);

                        // Optional: Message to alert about the lock
                        api.sendMessage(`⚠️ **𝐂𝐎𝐍𝐕𝐎 𝐍𝐀𝐌𝐄 𝐋𝐎𝐂𝐊:** Yeh group name currently lock hy convolution ke liye.\n\n📝 **𝐑𝐞𝐬𝐭𝐨𝐫𝐞𝐝 𝐭𝐨:** ${active.lockedName}`, threadID);
                    } catch (err) {
                        console.log('ConvoLock Error:', err.message);
                    }
                }
            }
        }
    }
};
