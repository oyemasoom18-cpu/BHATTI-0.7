const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const MESSAGE_LOG_FILE = path.join(__dirname, 'cache', 'message_log.json');
const RESEND_SETTINGS_FILE = path.join(__dirname, 'cache', 'resend_settings.json');

let messageLog = {};
let resendSettings = {};

async function loadMessageLog() {
    try {
        await fs.ensureDir(path.join(__dirname, 'cache'));
        if (await fs.pathExists(MESSAGE_LOG_FILE)) {
            messageLog = await fs.readJson(MESSAGE_LOG_FILE);
        }
    } catch (err) {
        messageLog = {};
    }
}

async function saveMessageLog() {
    try {
        await fs.ensureDir(path.join(__dirname, 'cache'));
        await fs.writeJson(MESSAGE_LOG_FILE, messageLog, { spaces: 2 });
    } catch (err) {
        console.log('Error saving message log:', err.message);
    }
}

async function loadResendSettings() {
    try {
        await fs.ensureDir(path.join(__dirname, 'cache'));
        if (await fs.pathExists(RESEND_SETTINGS_FILE)) {
            resendSettings = await fs.readJson(RESEND_SETTINGS_FILE);
        }
    } catch (err) {
        resendSettings = {};
    }
}

async function saveResendSettings() {
    try {
        await fs.ensureDir(path.join(__dirname, 'cache'));
        await fs.writeJson(RESEND_SETTINGS_FILE, resendSettings, { spaces: 2 });
    } catch (err) {
        console.log('Error saving resend settings:', err.message);
    }
}

loadMessageLog();
loadResendSettings();

setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000;
    let changed = false;
    
    for (const msgId in messageLog) {
        if (now - messageLog[msgId].timestamp > maxAge) {
            delete messageLog[msgId];
            changed = true;
        }
    }
    
    if (changed) saveMessageLog();
}, 5 * 60 * 1000);

module.exports.config = {
    name: "resend",
    version: "3.0.0",
    permission: 1,
    credits: "SARDAR RDX",
    description: "Resends unsent messages",
    prefix: true,
    premium: false,
    category: "system",
    usages: "resend [on/off]",
    cooldowns: 0
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, messageID } = event;
    
    await loadResendSettings();
    
    const currentStatus = resendSettings[threadID] !== false;
    
    if (args[0]) {
        const arg = args[0].toLowerCase();
        if (arg === 'on') {
            resendSettings[threadID] = true;
            await saveResendSettings();
            return api.sendMessage(
                `╭──────────────╮\n       ✨ 𝐑𝐄𝐒𝐄𝐍𝐃 𝐒𝐘𝐒𝐓𝐄𝐌 ✨\n╰──────────────╯\n\n🟢 Status: 𝐄𝐧𝐚𝐛𝐥𝐞𝐝 ✅\n━━━━━━━━━━━━━━━━━`,
                threadID, messageID
            );
        } else if (arg === 'off') {
            resendSettings[threadID] = false;
            await saveResendSettings();
            return api.sendMessage(
                `╭──────────────╮\n       ✨ 𝐑𝐄𝐒𝐄𝐍𝐃 𝐒𝐘𝐒𝐓𝐄𝐌 ✨\n╰──────────────╯\n\n🔴 Status: 𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝 ❌\n━━━━━━━━━━━━━━━━━`,
                threadID, messageID
            );
        }
    }
    
    resendSettings[threadID] = !currentStatus;
    await saveResendSettings();
    
    return api.sendMessage(
        `╭──────────────╮\n       ✨ 𝐑𝐄𝐒𝐄𝐍𝐃 𝐒𝐘𝐒𝐓𝐄𝐌 ✨\n╰──────────────╯\n\n⚙️ Status Updated To: ${resendSettings[threadID] ? "𝐄𝐧𝐚𝐛𝐥𝐞𝐝 ✅" : "𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝 ❌"}\n━━━━━━━━━━━━━━━━━`,
        threadID, messageID
    );
};

module.exports.logMessage = async function (messageID, content, attachments, senderID, threadID) {
    messageLog[messageID] = {
        content: content || '',
        attachments: attachments || [],
        senderID,
        threadID,
        timestamp: Date.now()
    };
    
    if (Object.keys(messageLog).length > 500) {
        const entries = Object.entries(messageLog);
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, 100);
        for (const [id] of toRemove) {
            delete messageLog[id];
        }
    }
    
    saveMessageLog();
};

module.exports.handleUnsend = async function (api, event, Users) {
    const { threadID, messageID, senderID } = event;
    
    await loadResendSettings();
    
    if (resendSettings[threadID] === false) return;
    
    await loadMessageLog();
    
    const savedMsg = messageLog[messageID];
    if (!savedMsg) return;
    
    let senderName = 'Unknown User';
    try {
        if (Users && Users.getNameUser) {
            senderName = await Users.getNameUser(senderID);
        } else {
            const info = await api.getUserInfo(senderID);
            senderName = info[senderID]?.name || 'Unknown User';
        }
    } catch (err) {
        senderName = 'Unknown User';
    }
    
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    
    if (!savedMsg.attachments || savedMsg.attachments.length === 0) {
        await api.sendMessage(
            `╭───────༺⭐༻───────╮\n       🗑️ 𝐔𝐍𝐒𝐄𝐍𝐓 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 🗑️\n╰───────༺⭐༻───────╯\n\n👤 𝐍𝐚𝐦𝐞: ${senderName}\n💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞: ${savedMsg.content || '(empty)'}\n\n━━━━━━━━━━━━━━━━━━━━`,
            threadID
        );
    } else {
        const attachmentStreams = [];
        let num = 0;
        
        for (const att of savedMsg.attachments) {
            if (att.url) {
                try {
                    num++;
                    const response = await axios.get(att.url, { 
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    
                    let ext = 'jpg';
                    if (att.type === 'video') ext = 'mp4';
                    else if (att.type === 'audio') ext = 'mp3';
                    else if (att.type === 'file') ext = att.filename?.split('.').pop() || 'bin';
                    else if (att.type === 'animated_image') ext = 'gif';
                    
                    const filePath = path.join(cacheDir, `resend_${num}_${Date.now()}.${ext}`);
                    await fs.writeFile(filePath, Buffer.from(response.data));
                    attachmentStreams.push(fs.createReadStream(filePath));
                    
                    setTimeout(() => {
                        try { fs.unlinkSync(filePath); } catch (e) {}
                    }, 30000);
                } catch (err) {
                    console.log('Failed to download attachment:', err.message);
                }
            }
        }
        
        const msgContent = savedMsg.content ? `\n💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞: ${savedMsg.content}` : '';
        
        await api.sendMessage(
            {
                body: `╭───────༺⭐༻───────╮\n       🗑️ 𝐔𝐍𝐒𝐄𝐍𝐓 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 🗑️\n╰───────༺⭐༻───────╯\n\n👤 𝐍𝐚𝐦𝐞: ${senderName}\n📎 𝐀𝐭𝐭𝐚𝐜𝐡𝐦𝐞𝐧𝐭𝐬: ${savedMsg.attachments.length}${msgContent}\n\n━━━━━━━━━━━━━━━━━━━━`,
                attachment: attachmentStreams.length > 0 ? attachmentStreams : undefined
            },
            threadID
        );
    }
    
    delete messageLog[messageID];
    saveMessageLog();
};

module.exports.isEnabled = function (threadID) {
    return resendSettings[threadID] !== false;
};

module.exports.getMessageLog = function () {
    return messageLog;
};

