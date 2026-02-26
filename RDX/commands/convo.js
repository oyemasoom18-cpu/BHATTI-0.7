const fs = require('fs-extra');
const path = require('path');

// Global Initialization for Command Lockdown
if (!global.activeConvos) {
    global.activeConvos = new Map(); // targetTID -> { timeout, originThreadID, targetName }
}

module.exports = {
    config: {
        name: "convo",
        aliases: ["convolution", "rdxconvo"],
        description: "Premium multi-step convolution with Group Lockdown",
        credits: "SARDAR RDX",
        usage: "convo on / convo off",
        category: "Tools",
        prefix: true
    },

    async run({ api, event, send, client, config }) {
        const { threadID, senderID, body } = event;
        const args = body.split(/\s+/);
        const action = args[1]?.toLowerCase();

        // 👮 Admin Check (Bot Admin or Group Admin)
        const isAdmin = config.ADMINBOT?.includes(senderID);
        if (!isAdmin) {
            try {
                const info = await api.getThreadInfo(threadID);
                if (!info.adminIDs.some(a => a.id === senderID)) {
                    return send.reply("❌ 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝: Ye command sirf Bot Admin ya Group Admin use kr skty hain. 👮");
                }
            } catch (e) {
                return send.reply("❌ Error checking permissions: " + e.message);
            }
        }

        if (action === "off") {
            const activeList = [];
            global.activeConvos.forEach((val, key) => {
                activeList.push({ targetTID: key, ...val });
            });

            if (activeList.length === 0) {
                return send.reply("❌ 𝐄𝐫𝐫𝐨𝐫: Abhi koi bhi active convo nahi chal rahi.");
            }

            let listMsg = `╔═══════════════════════╗
   🛑 𝐀𝐂𝐓𝐈𝐕𝐄 𝐂𝐎𝐍𝐕𝐎𝐒 🛑
╚═══════════════════════╝\n\n`;

            activeList.forEach((item, index) => {
                listMsg += `【 ${index + 1} 】 Group: ${item.targetName || 'Unknown'}\n`;
                listMsg += `🆔 TID: ${item.targetTID}\n`;
                listMsg += `👤 Origin: ${item.originThreadID}\n`;
                listMsg += `─────────────────────\n`;
            });

            listMsg += `\n👉 **Number** reply kro jis group ki convo OFF krni hy.`;

            const infoOff = await send.reply(listMsg);
            if (client.replies) {
                client.replies.set(infoOff.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: "OFF_LIST",
                        activeList
                    }
                });
            }
            return;
        }

        if (action === "on") {
            const msg = `╔═══════════════════╗
   🚀 𝐂𝐎𝐍𝐕𝐎 𝐌𝐎𝐃𝐄 𝐎𝐍 🚀
╚═══════════════════╝

✅ Convo Mode Activate ho gaya hy!

𝐒𝐭𝐞𝐩 𝟏: Bot 𝐇𝐞𝐚𝐭𝐞𝐫𝐬 𝐍𝐚𝐦𝐞 pochy ga jo har msg ka start ma lage ga.

👉 Apna Name likho ya **"skip"** type kro.`;

            const info = await send.reply(msg);

            if (client.replies) {
                client.replies.set(info.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 1,
                        convoData: {}
                    }
                });
            }
            return;
        }

        return send.reply(`💡 Usage: ${config.PREFIX}convo on | off`);
    },

    async handleReply({ api, event, send, client, data, config, Users }) {
        const { body, senderID, threadID } = event;
        if (data.author && senderID !== data.author) return;

        let { step, convoData = {} } = data;

        if (step === "OFF_LIST") {
            const index = parseInt(body) - 1;
            if (isNaN(index) || !data.activeList[index]) {
                return send.reply("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐒𝐞𝐥𝐞𝐜𝐭𝐢𝐨𝐧! List ma se sahi number choose kro.");
            }
            const item = data.activeList[index];
            if (item.timeout) clearTimeout(item.timeout);
            global.activeConvos.delete(item.targetTID);
            return send.reply(`✅ Successfully stopped convo for group: **${item.targetName}** (TID: ${item.targetTID})`);
        }

        switch (step) {
            case 1: // Haters Name
                convoData.hatersName = body.toLowerCase() === "skip" ? "" : body;

                const convoPath = path.join(__dirname, "CONVO");
                let files = [];
                try {
                    if (fs.existsSync(convoPath)) {
                        files = fs.readdirSync(convoPath).filter(f => f.endsWith(".txt"));
                    }
                } catch (e) {
                    console.log("Convo Path Error:", e.message);
                }

                let fileListMsg = `╔══════════════════╗
   📂 𝐅𝐈𝐋𝐄 𝐒𝐄𝐋𝐄𝐂𝐓𝐈𝐎𝐍 📂
╚══════════════════╝\n\n`;
                if (files.length > 0) {
                    files.forEach((file, index) => {
                        fileListMsg += `【 ${index + 1} 】 ${file.replace('.txt', '')}\n`;
                    });
                } else {
                    fileListMsg += "⚠️ No .txt files found in CONVO folder!\n";
                }
                fileListMsg += `\n👉 **Number** choose kro (1, 2, 3...)
👉 Ya **"manual"** likho apna message khud dene ke liye.`;

                const info2 = await send.reply(fileListMsg);
                client.replies.set(info2.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 2,
                        convoData,
                        files
                    }
                });
                break;

            case 2: // File Selection or Manual Choice
                if (body.toLowerCase() === "manual") {
                    convoData.mode = "manual";
                    const infoManual = await send.reply(`📝 [ 𝐌𝐀𝐍𝐔𝐀𝐋 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 ]\n─────────────────────\nApna manual message ya puri file (multiple lines) yahan paste kro.`);
                    client.replies.set(infoManual.messageID, {
                        commandName: "convo",
                        author: senderID,
                        data: {
                            step: 2.1,
                            convoData
                        }
                    });
                } else {
                    const fileIndex = parseInt(body) - 1;
                    if (isNaN(fileIndex) || !data.files || !data.files[fileIndex]) {
                        return send.reply("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐒𝐞𝐥𝐞𝐜𝐭𝐢𝐨𝐧! Sahi number do ya 'manual' likho.");
                    }
                    convoData.mode = "file";
                    convoData.fileName = data.files[fileIndex];
                    const infoTid = await send.reply(`🆔 [ 𝐓𝐀𝐑𝐆𝐄𝐓 𝐆𝐑𝐎𝐔𝐏 𝐈𝐃 ]\n─────────────────────\nJis group (TID) ma messages send krne hain uski ID paste kro.`);
                    client.replies.set(infoTid.messageID, {
                        commandName: "convo",
                        author: senderID,
                        data: {
                            step: 3,
                            convoData
                        }
                    });
                }
                break;

            case 2.1: // Manual Messages input
                convoData.messages = body.split("\n").filter(m => m.trim() !== "");
                if (convoData.messages.length === 0) return send.reply("❌ Error: Kam se kam ek message to do!");
                const infoTidManual = await send.reply(`🆔 [ 𝐓𝐀𝐑𝐆𝐄𝐓 𝐆𝐑𝐎𝐔𝐏 𝐈𝐃 ]\n─────────────────────\nTarget group ki TID paste kro.`);
                client.replies.set(infoTidManual.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 3,
                        convoData
                    }
                });
                break;

            case 3: // TID Input
                convoData.targetTID = body.trim();
                const infoSpeed = await send.reply(`⏱️ [ 𝐒𝐄𝐍𝐃𝐈𝐍𝐆 𝐒𝐏𝐄𝐄𝐃 ]\n─────────────────────\nMessages ki speed pochy ga (seconds ma).\n\n🔹 Min: 10s\n🔹 Max: 100s\n\n👉 Sirf number likho (e.g. 15)`);
                client.replies.set(infoSpeed.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 4,
                        convoData
                    }
                });
                break;

            case 4: // Speed Input
                const speed = parseInt(body);
                if (isNaN(speed) || speed < 10 || speed > 100) {
                    return send.reply("❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐒𝐩𝐞𝐞𝐝! Speed 10 se 100 ke darmiyan honi chahiye.");
                }
                convoData.speed = speed;
                const infoGroupName = await send.reply(`🏷️ [ 𝐆𝐑𝐎𝐔𝐏 𝐍𝐀𝐌𝐄 𝐔𝐏𝐃𝐀𝐓𝐄 ]\n─────────────────────\nTarget group ka name kia rakhna hy?\n\n👉 Name likho ya **"skip"** type kro.`);
                client.replies.set(infoGroupName.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 5,
                        convoData
                    }
                });
                break;

            case 5: // Group Name Update
                convoData.groupName = body.toLowerCase() === "skip" ? null : body;
                const infoNickname = await send.reply(`👤 [ 𝐍𝐈𝐂𝐊𝐍𝐀𝐌𝐄 𝐔𝐏𝐃𝐀𝐓𝐄 ]\n─────────────────────\nAll members ka nickname kia set krna hy?\n\n👉 Nickname likho ya **"skip"** type kro.`);
                client.replies.set(infoNickname.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 6,
                        convoData
                    }
                });
                break;

            case 6: // Nickname Update
                convoData.nickname = body.toLowerCase() === "skip" ? null : body;
                const infoMentions = await send.reply(`👥 [ 𝐌𝐄𝐍𝐓𝐈𝐎𝐍 𝐔𝐒𝐄𝐑𝐒 ]\n─────────────────────\nUIDs space de kr likho.\n\n👉 UIDs do (e.g. 1000... 1000...) ya **"skip"** type kro.`);
                client.replies.set(infoMentions.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 7,
                        convoData
                    }
                });
                break;

            case 7: // Mentions Input
                if (body.toLowerCase() === "skip") {
                    convoData.mentions = [];
                } else {
                    const uids = new Set();
                    // 1. Collect from actual mentions in the message
                    if (event.mentions && Object.keys(event.mentions).length > 0) {
                        Object.keys(event.mentions).forEach(id => uids.add(id));
                    }
                    // 2. Also check for raw IDs in the body
                    body.split(/\s+/).forEach(id => {
                        if (/^\d{10,20}$/.test(id)) uids.add(id);
                    });

                    convoData.mentions = Array.from(uids);
                }

                if (convoData.mentions.length === 0 && body.toLowerCase() !== "skip") {
                    return send.reply("⚠️ Mentions use krne ke liye kisi ko **Tag** kro ya unki **UID** likho.\n\n👉 Type 'skip' to disable mentions.");
                }

                let summary = `╔═══════════════════╗
   ✅ 𝐂𝐎𝐍𝐕𝐎 𝐒𝐔𝐌𝐌𝐀𝐑𝐘 ✅
╚═══════════════════════╝

👑 **Haters Name:** ${convoData.hatersName || "Default"}
📂 **Source:** ${convoData.mode === "file" ? convoData.fileName : "Manual Input"}
🆔 **Target TID:** ${convoData.targetTID}
⏱️ **Interval:** ${convoData.speed} Seconds
🏷️ **New Title:** ${convoData.groupName || "No Change"}
👤 **Nickname:** ${convoData.nickname || "No Change"}
👥 **Mentions:** ${convoData.mentions.length > 0 ? convoData.mentions.length + " Users" : "Disabled"}

─────────────────────
🚀 Type **"confirm"** to Start Convo!`;

                const infoConfirm = await send.reply(summary);
                client.replies.set(infoConfirm.messageID, {
                    commandName: "convo",
                    author: senderID,
                    data: {
                        step: 8,
                        convoData
                    }
                });
                break;

            case 8: // Final Confirmation
                if (body.toLowerCase() === "confirm") {
                    await send.reply("⛓️ **𝐂𝐎𝐍𝐕𝐎𝐋𝐔𝐓𝐈𝐎𝐍 𝐒𝐓𝐀𝐑𝐓𝐄𝐃!** 🚀\n─────────────────────\nBot checks target group and starting delivery cycle.");
                    this.startConvolution(api, convoData, threadID);
                } else {
                    send.reply("❌ Convo Setup Cancelled.");
                }
                break;
        }
    },

    async startConvolution(api, data, originThreadID) {
        const { targetTID, speed, hatersName, mentions, groupName, nickname, mode, fileName, messages: manualMsgs } = data;

        let messages = [];
        if (mode === "file") {
            try {
                const filePath = path.join(__dirname, "CONVO", fileName);
                if (!fs.existsSync(filePath)) throw new Error("File not found");
                const content = fs.readFileSync(filePath, "utf-8");
                messages = content.split("\n").filter(l => l.trim() !== "");
            } catch (e) {
                return api.sendMessage("❌ 𝐄𝐫𝐫𝐨𝐫 reading convo file: " + e.message, originThreadID);
            }
        } else {
            messages = manualMsgs;
        }

        if (!messages || messages.length === 0) {
            return api.sendMessage("❌ 𝐄𝐫𝐫𝐨𝐫: No messages found to send.", originThreadID);
        }

        // 🏷️ Fetch Names for Mentions and Group
        let targetName = "Unknown Group";
        let mentionUserNames = {}; // uid -> name

        try {
            // Fetch Thread Info
            const info = await api.getThreadInfo(targetTID).catch(() => ({}));
            targetName = info.threadName || info.name || "Unnamed Group";

            // Fetch Mention Names if any
            if (mentions.length > 0) {
                for (const uid of mentions) {
                    let name = "User";
                    try {
                        if (Users && Users.getNameUser) {
                            name = await Users.getNameUser(uid);
                        } else {
                            const user = await api.getUserInfo(uid);
                            name = user[uid]?.name || "User";
                        }
                    } catch (e) {
                        console.log(`Error fetching name for ${uid}:`, e.message);
                    }
                    // Clean name: remove special chars that might break tagging if needed
                    // But usually, the full name is required for Facebook tagging via tag/offset
                    mentionUserNames[uid] = name;
                }
            }
        } catch (e) {
            console.log("Pre-fetch error:", e.message);
        }

        // Initialize Active State
        if (global.activeConvos.has(targetTID)) {
            const old = global.activeConvos.get(targetTID);
            if (old.timeout) clearTimeout(old.timeout);
        }

        // Rename Group if requested
        if (groupName) {
            api.setTitle(groupName, targetTID, (err) => {
                if (err) console.log("Convo Rename Fail:", err.message);
            });
            targetName = groupName;
        }

        // Change Nicknames if requested
        if (nickname) {
            api.getThreadInfo(targetTID, (err, info) => {
                if (!err && info.participantIDs) {
                    info.participantIDs.forEach(uid => {
                        api.changeNickname(nickname, targetTID, uid, (e) => { });
                    });
                }
            });
        }

        let index = 0;
        const executeCycle = async () => {
            if (!global.activeConvos.has(targetTID)) return;

            if (index >= messages.length) {
                api.sendMessage(`🏁 **𝐂𝐎𝐍𝐕𝐎 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄𝐃!** 🕊️\n─────────────────────\nTotal ${messages.length} messages sent to ${targetTID}.`, originThreadID);
                global.activeConvos.delete(targetTID);
                return;
            }

            let msgBody = "";
            if (hatersName) msgBody += `${hatersName} `;

            let mentionData = [];
            let currentOffset = msgBody.length;

            if (mentions.length > 0) {
                mentions.forEach((uid) => {
                    const name = mentionUserNames[uid] || "User";
                    const tag = `@${name}`;
                    msgBody += `${tag} `;
                    mentionData.push({ id: uid, tag: tag, fromIndex: currentOffset });
                    currentOffset += tag.length + 1; // +1 for the space
                });
            }

            msgBody += messages[index];

            api.sendMessage({ body: msgBody, mentions: mentionData }, targetTID, (err) => {
                if (err) console.log(`Convo Msg Error:`, err.message);
            });

            index++;
            const timeout = setTimeout(executeCycle, speed * 1000);
            global.activeConvos.set(targetTID, { timeout, originThreadID, targetName, lockedName: groupName });
        };

        global.activeConvos.set(targetTID, { originThreadID, targetName, lockedName: groupName });
        executeCycle();
    }
};
