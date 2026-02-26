const stringSimilarity = require('string-similarity');
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ======================
// ALL BOT COMMANDS (175+)
// ======================
const ALL_COMMANDS = {
  // Economy
  'balance': { name: 'balance', desc: 'Check coin & bank balance', usage: 'balance', aliases: ['bal', 'coins', 'money'], category: 'Economy' },
  'deposit': { name: 'deposit', desc: 'Deposit coins to bank', usage: 'deposit [amount]', aliases: ['dep', 'save'], category: 'Economy' },
  'withdraw': { name: 'withdraw', desc: 'Withdraw coins from bank', usage: 'withdraw [amount]', aliases: ['with', 'wd'], category: 'Economy' },
  'daily': { name: 'daily', desc: 'Claim daily free coins (50-200)', usage: 'daily', aliases: ['d', 'claim', 'reward'], category: 'Economy' },
  'openaccount': { name: 'openaccount', desc: 'Create bank account', usage: 'openaccount [name]', aliases: ['account', 'register'], category: 'Economy' },
  'bank': { name: 'bank', desc: 'Bank account guide - why important', usage: 'bank', aliases: [], category: 'Economy' },
  'mybank': { name: 'mybank', desc: 'View bank account details', usage: 'mybank', aliases: ['bankinfo'], category: 'Economy' },
  'transfer': { name: 'transfer', desc: 'Transfer coins to user', usage: 'transfer @user [amount]', aliases: ['send'], category: 'Economy' },
  'work': { name: 'work', desc: 'Work to earn coins', usage: 'work', aliases: [], category: 'Economy' },
  'rankup': { name: 'rankup', desc: 'Check rank & upgrade', usage: 'rankup', aliases: [], category: 'Economy' },
  'top': { name: 'top', desc: 'Show top users leaderboard', usage: 'top', aliases: [], category: 'Economy' },
  
  // Love & Social
  'pair': { name: 'pair', desc: 'Create love pair with user', usage: 'pair @user', aliases: ['couple', 'ship'], category: 'Love' },
  'pair2': { name: 'pair2', desc: 'Pair variant 2', usage: 'pair2 @user', aliases: [], category: 'Love' },
  'pair3': { name: 'pair3', desc: 'Pair variant 3', usage: 'pair3 @user', aliases: [], category: 'Love' },
  'pair4': { name: 'pair4', desc: 'Pair variant 4', usage: 'pair4 @user', aliases: [], category: 'Love' },
  'pair5': { name: 'pair5', desc: 'Pair variant 5', usage: 'pair5 @user', aliases: [], category: 'Love' },
  'pair6': { name: 'pair6', desc: 'Pair variant 6', usage: 'pair6 @user', aliases: [], category: 'Love' },
  'pair7': { name: 'pair7', desc: 'Pair variant 7', usage: 'pair7 @user', aliases: [], category: 'Love' },
  'pair8': { name: 'pair8', desc: 'Pair variant 8', usage: 'pair8 @user', aliases: [], category: 'Love' },
  'pair9': { name: 'pair9', desc: 'Pair variant 9', usage: 'pair9 @user', aliases: [], category: 'Love' },
  'pair10': { name: 'pair10', desc: 'Pair variant 10', usage: 'pair10 @user', aliases: [], category: 'Love' },
  'marry': { name: 'marry', desc: 'Marry another user', usage: 'marry @user', aliases: ['wed', 'wedding'], category: 'Love' },
  'bestfriend': { name: 'bestfriend', desc: 'Add user as BFF', usage: 'bestfriend @user', aliases: ['bff', 'bf'], category: 'Social' },
  'lovecpl': { name: 'lovecpl', desc: 'Send love couple image', usage: 'lovecpl', aliases: [], category: 'Love' },
  'brother': { name: 'brother', desc: 'Add brother relation', usage: 'brother @user', aliases: [], category: 'Social' },
  'sister': { name: 'sister', desc: 'Add sister relation', usage: 'sister @user', aliases: [], category: 'Social' },
  'sibling': { name: 'sibling', desc: 'Add sibling relation', usage: 'sibling @user', aliases: [], category: 'Social' },
  
  // Fun
  'hack': { name: 'hack', desc: 'Prank hack user', usage: 'hack @user', aliases: [], category: 'Fun' },
  'slap': { name: 'slap', desc: 'Slap a user', usage: 'slap @user', aliases: [], category: 'Fun' },
  'kiss': { name: 'kiss', desc: 'Send kiss to user', usage: 'kiss @user', aliases: [], category: 'Fun' },
  'flirt': { name: 'flirt', desc: 'Send flirt message', usage: 'flirt @user', aliases: [], category: 'Fun' },
  
  // Food Images
  'biryani': { name: 'biryani', desc: 'Send biryani image', usage: 'biryani', aliases: ['biryaan', 'briyani'], category: 'Fun' },
  'chicken': { name: 'chicken', desc: 'Send chicken image', usage: 'chicken', aliases: ['chick', 'murghi'], category: 'Fun' },
  'pizza': { name: 'pizza', desc: 'Send pizza image', usage: 'pizza', aliases: [], category: 'Fun' },
  'pasta': { name: 'pasta', desc: 'Send pasta image', usage: 'pasta', aliases: [], category: 'Fun' },
  'noodles': { name: 'noodles', desc: 'Send noodles image', usage: 'noodles', aliases: [], category: 'Fun' },
  'icecream': { name: 'icecream', desc: 'Send ice cream image', usage: 'icecream', aliases: [], category: 'Fun' },
  'juice': { name: 'juice', desc: 'Send juice image', usage: 'juice', aliases: [], category: 'Fun' },
  'lassi': { name: 'lassi', desc: 'Send lassi image', usage: 'lassi', aliases: [], category: 'Fun' },
  'milkshake': { name: 'milkshake', desc: 'Send milkshake image', usage: 'milkshake', aliases: [], category: 'Fun' },
  'chocolate': { name: 'chocolate', desc: 'Send chocolate image', usage: 'chocolate', aliases: ['choco'], category: 'Fun' },
  'barfi': { name: 'barfi', desc: 'Send barfi image', usage: 'barfi', aliases: ['barf'], category: 'Fun' },
  'gulabjaman': { name: 'gulabjaman', desc: 'Send gulab jaman image', usage: 'gulabjaman', aliases: ['gulab'], category: 'Fun' },
  'rasgullah': { name: 'rasgullah', desc: 'Send rasgullah image', usage: 'rasgullah', aliases: ['rasgu'], category: 'Fun' },
  'gajar': { name: 'gajar', desc: 'Send gajar halwa image', usage: 'gajar', aliases: [], category: 'Fun' },
  'dahibhaly': { name: 'dahibhaly', desc: 'Send dahi bhalla image', usage: 'dahibhaly', aliases: [], category: 'Fun' },
  'golgapy': { name: 'golgapy', desc: 'Send golgappa image', usage: 'golgapy', aliases: [], category: 'Fun' },
  'redbull': { name: 'redbull', desc: 'Send redbull image', usage: 'redbull', aliases: [], category: 'Fun' },
  'sting': { name: 'sting', desc: 'Send sting image', usage: 'sting', aliases: [], category: 'Fun' },
  'macaroni': { name: 'macaroni', desc: 'Send macaroni image', usage: 'macaroni', aliases: [], category: 'Fun' },
  
  // Media & Download
  'tiktok': { name: 'tiktok', desc: 'Download TikTok video', usage: 'tiktok [link]', aliases: ['tt', 'ttdl'], category: 'Media' },
  'music': { name: 'music', desc: 'Play/download music', usage: 'music [song]', aliases: ['play', 'song'], category: 'Media' },
  'video': { name: 'video', desc: 'Download YouTube video', usage: 'video [name]', aliases: ['vid'], category: 'Media' },
  'suno': { name: 'suno', desc: 'Generate AI song', usage: 'suno [lyrics]', aliases: [], category: 'Media' },
  'gif': { name: 'gif', desc: 'Search GIF', usage: 'gif [search]', aliases: [], category: 'Media' },
  'sticker': { name: 'sticker', desc: 'Convert image to sticker', usage: 'sticker', aliases: [], category: 'Media' },
  
  // Social
  'friend': { name: 'friend', desc: 'Send friend request', usage: 'friend @user', aliases: ['fr', 'add'], category: 'Social' },
  'accept': { name: 'accept', desc: 'Accept friend request', usage: 'accept @user', aliases: ['acc'], category: 'Social' },
  'block': { name: 'block', desc: 'Block user', usage: 'block @user', aliases: ['blk'], category: 'Social' },
  'unblock': { name: 'unblock', desc: 'Unblock user', usage: 'unblock @user', aliases: [], category: 'Social' },
  'unfriend': { name: 'unfriend', desc: 'Remove friend', usage: 'unfriend @user', aliases: [], category: 'Social' },
  'friendlist': { name: 'friendlist', desc: 'View friends list', usage: 'friendlist', aliases: ['fl'], category: 'Social' },
  'friendpair': { name: 'friendpair', desc: 'View friend pairs', usage: 'friendpair', aliases: [], category: 'Social' },
  
  // Group Management
  'kick': { name: 'kick', desc: 'Kick user from group', usage: 'kick @user', aliases: [], category: 'Admin' },
  'kickall': { name: 'kickall', desc: 'Kick all members', usage: 'kickall', aliases: [], category: 'Admin' },
  'ban': { name: 'ban', desc: 'Ban user from bot', usage: 'ban @user', aliases: [], category: 'Admin' },
  'unban': { name: 'unban', desc: 'Unban user', usage: 'unban @user', aliases: [], category: 'Admin' },
  'mute': { name: 'mute', desc: 'Mute user in group', usage: 'mute @user', aliases: [], category: 'Admin' },
  'unmute': { name: 'unmute', desc: 'Unmute user', usage: 'unmute @user', aliases: [], category: 'Admin' },
  'join': { name: 'join', desc: 'Join group via invite', usage: 'join [link]', aliases: [], category: 'Utility' },
  'out': { name: 'out', desc: 'Leave group', usage: 'out', aliases: [], category: 'Utility' },
  'outall': { name: 'outall', desc: 'Leave all groups', usage: 'outall', aliases: [], category: 'Admin' },
  'lockgroup': { name: 'lockgroup', desc: 'Lock group settings', usage: 'lockgroup', aliases: [], category: 'Admin' },
  'setemoji': { name: 'setemoji', desc: 'Set group emoji', usage: 'setemoji [emoji]', aliases: [], category: 'Admin' },
  'setgroupimage': { name: 'setgroupimage', desc: 'Set group photo', usage: 'setgroupimage', aliases: [], category: 'Admin' },
  'setname': { name: 'setname', desc: 'Set group name', usage: 'setname [name]', aliases: [], category: 'Admin' },
  'creategroup': { name: 'creategroup', desc: 'Create new group', usage: 'creategroup [name]', aliases: [], category: 'Utility' },
  'groupadmin': { name: 'groupadmin', desc: 'Make user admin', usage: 'groupadmin @user', aliases: [], category: 'Admin' },
  'removeadmin': { name: 'removeadmin', desc: 'Remove admin', usage: 'removeadmin @user', aliases: [], category: 'Admin' },
  'approve': { name: 'approve', desc: 'Approve user', usage: 'approve @user', aliases: [], category: 'Admin' },
  'unapprove': { name: 'unapprove', desc: 'Unapprove user', usage: 'unapprove @user', aliases: [], category: 'Admin' },
  'threadban': { name: 'threadban', desc: 'Ban from thread', usage: 'threadban @user', aliases: [], category: 'Admin' },
  'threadlist': { name: 'threadlist', desc: 'List group threads', usage: 'threadlist', aliases: [], category: 'Utility' },
  'groupslist': { name: 'groupslist', desc: 'List all groups', usage: 'groupslist', aliases: [], category: 'Admin' },
  'groupinfo': { name: 'groupinfo', desc: 'View group info', usage: 'groupinfo', aliases: [], category: 'Utility' },
  
  // Admin & System
  'convo': { name: 'convo', desc: 'Start/stop message cycle', usage: 'convo on/off', aliases: [], category: 'Admin' },
  'broadcast': { name: 'broadcast', desc: 'Broadcast to all groups', usage: 'broadcast [msg]', aliases: ['bc'], category: 'Admin' },
  'clearcache': { name: 'clearcache', desc: 'Clear bot cache', usage: 'clearcache', aliases: [], category: 'Admin' },
  'restart': { name: 'restart', desc: 'Restart bot', usage: 'restart', aliases: [], category: 'Admin' },
  'logout': { name: 'logout', desc: 'Logout bot', usage: 'logout', aliases: [], category: 'Admin' },
  'prefix': { name: 'prefix', desc: 'Check/change prefix', usage: 'prefix [new]', aliases: ['setprefix'], category: 'Utility' },
  'setprefix': { name: 'setprefix', desc: 'Set new prefix', usage: 'setprefix [symbol]', aliases: [], category: 'Admin' },
  'adminonly': { name: 'adminonly', desc: 'Toggle admin only mode', usage: 'adminonly on/off', aliases: [], category: 'Admin' },
  'adminnoti': { name: 'adminnoti', desc: 'Admin notifications', usage: 'adminnoti on/off', aliases: [], category: 'Admin' },
  'autoseen': { name: 'autoseen', desc: 'Auto seen messages', usage: 'autoseen on/off', aliases: [], category: 'Utility' },
  'autoban': { name: 'autoban', desc: 'Auto ban spam', usage: 'autoban on/off', aliases: [], category: 'Admin' },
  'autosend': { name: 'autosend', desc: 'Auto send messages', usage: 'autosend on/off', aliases: [], category: 'Admin' },
  'testmode': { name: 'testmode', desc: 'Test mode toggle', usage: 'testmode on/off', aliases: [], category: 'Admin' },
  'filterdb': { name: 'filterdb', desc: 'Filter database', usage: 'filterdb', aliases: [], category: 'Admin' },
  'resetdata': { name: 'resetdata', desc: 'Reset all data', usage: 'resetdata', aliases: [], category: 'Admin' },
  
  // User Info
  'user': { name: 'user', desc: 'Get user info', usage: 'user @user', aliases: [], category: 'Utility' },
  'uid': { name: 'uid', desc: 'Get user ID', usage: 'uid @user', aliases: [], category: 'Utility' },
  'uidall': { name: 'uidall', desc: 'Get all user IDs', usage: 'uidall', aliases: [], category: 'Utility' },
  'avatar': { name: 'avatar', desc: 'Get user avatar', usage: 'avatar @user', aliases: [], category: 'Utility' },
  'cover': { name: 'cover', desc: 'Get user cover photo', usage: 'cover @user', aliases: [], category: 'Utility' },
  'bio': { name: 'bio', desc: 'Get user bio', usage: 'bio @user', aliases: [], category: 'Utility' },
  'nickname': { name: 'nickname', desc: 'Set nickname', usage: 'nickname [name]', aliases: [], category: 'Utility' },
  'rankup': { name: 'rankup', desc: 'Check rank & upgrade', usage: 'rankup', aliases: [], category: 'Economy' },
  
  // Utilities
  'help': { name: 'help', desc: 'Show command menu', usage: 'help [page]', aliases: ['h', 'menu', 'cmds'], category: 'Utility' },
  'ping': { name: 'ping', desc: 'Check bot ping', usage: 'ping', aliases: [], category: 'Utility' },
  'uptime': { name: 'uptime', desc: 'Check bot uptime', usage: 'uptime', aliases: ['upt'], category: 'Utility' },
  'weather': { name: 'weather', desc: 'Check weather', usage: 'weather [city]', aliases: [], category: 'Utility' },
  'translate': { name: 'translate', desc: 'Translate text', usage: 'translate [lang] [text]', aliases: [], category: 'Utility' },
  'history': { name: 'history', desc: 'Chat history', usage: 'history', aliases: [], category: 'Utility' },
  'spam': { name: 'spam', desc: 'Spam messages', usage: 'spam [count] [msg]', aliases: [], category: 'Fun' },
  'say': { name: 'say', desc: 'Bot say message', usage: 'say [text]', aliases: [], category: 'Fun' },
  'poll': { name: 'poll', desc: 'Create poll', usage: 'poll [question]', aliases: [], category: 'Utility' },
  'watch': { name: 'watch', desc: 'Watch YouTube together', usage: 'watch [link]', aliases: [], category: 'Media' },
  'play': { name: 'play', desc: 'Play YouTube', usage: 'play [video]', aliases: [], category: 'Media' },
  'tiktokdl': { name: 'tiktokdl', desc: 'Download TikTok', usage: 'tiktokdl [link]', aliases: [], category: 'Media' },
  
  // Special
  'rdxai': { name: 'rdxai', desc: 'AI Assistant', usage: 'rdxai [question]', aliases: ['ai'], category: 'AI' },
  'goibot': { name: 'goibot', desc: 'Chat bot', usage: 'goibot [msg]', aliases: ['bot', 'mano'], category: 'AI' },
  'setrdxaikey': { name: 'setrdxaikey', desc: 'Set AI API key', usage: 'setrdxaikey [key]', aliases: ['setaikey'], category: 'Admin' },
  
  // Other
  'info': { name: 'info', desc: 'Bot info', usage: 'info', aliases: [], category: 'Utility' },
  'allinfo': { name: 'allinfo', desc: 'All groups info', usage: 'allinfo', aliases: ['allgroups', 'botgroups'], category: 'Admin' },
  'accountlist': { name: 'accountlist', desc: 'List accounts', usage: 'accountlist', aliases: [], category: 'Admin' },
  'pending': { name: 'pending', desc: 'Pending requests', usage: 'pending', aliases: [], category: 'Admin' },
  'resend': { name: 'resend', desc: 'Resend message', usage: 'resend', aliases: [], category: 'Utility' },
  'unsend': { name: 'unsend', desc: 'Unsend message', usage: 'unsend', aliases: [], category: 'Utility' },
  'pin': { name: 'pin', desc: 'Pin message', usage: 'pin', aliases: [], category: 'Admin' },
  'call': { name: 'call', desc: 'Call user', usage: 'call @user', aliases: ['called'], category: 'Fun' },
  'shareid': { name: 'shareid', desc: 'Share your ID', usage: 'shareid', aliases: [], category: 'Utility' },
  'bor': { name: 'bor', desc: 'Send bor image', usage: 'bor', aliases: [], category: 'Fun' },
  'busy': { name: 'busy', desc: 'Set busy mode', usage: 'busy on/off', aliases: [], category: 'Utility' },
  'engaged': { name: 'engaged', desc: 'Set engaged mode', usage: 'engaged on/off', aliases: [], category: 'Utility' },
  'nickcheck': { name: 'nickcheck', desc: 'Check nickname', usage: 'nickcheck on/off', aliases: [], category: 'Admin' },
  'nicklock': { name: 'nicklock', desc: 'Lock nicknames', usage: 'nicklock on/off', aliases: [], category: 'Admin' },
  'guard': { name: 'guard', desc: 'Guard group', usage: 'guard on/off', aliases: [], category: 'Admin' },
  'rdxhere': { name: 'rdxhere', desc: 'RDX in group check', usage: 'rdxhere', aliases: [], category: 'Utility' },
  'antijoin': { name: 'antijoin', desc: 'Anti join toggle', usage: 'antijoin on/off', aliases: [], category: 'Admin' },
  'antiout': { name: 'antiout', desc: 'Anti out toggle', usage: 'antiout on/off', aliases: [], category: 'Admin' },
  'inbox': { name: 'inbox', desc: 'Send to inbox', usage: 'inbox @user [msg]', aliases: [], category: 'Utility' },
  'sentnoti': { name: 'sentnoti', desc: 'Sent notifications', usage: 'sentnoti on/off', aliases: [], category: 'Admin' },
  'snb': { name: 'snb', desc: 'Send note', usage: 'snb [text]', aliases: [], category: 'Utility' },
  'rankup': { name: 'rankup', desc: 'Check rank & upgrade', usage: 'rankup', aliases: [], category: 'Economy' },
  'fyt': { name: 'fyt', desc: 'For You Thread', usage: 'fyt', aliases: [], category: 'Media' },
  'fyt2': { name: 'fyt2', desc: 'FYT variant', usage: 'fyt2', aliases: [], category: 'Media' },
  'ibb': { name: 'ibb', desc: 'Image search', usage: 'ibb [search]', aliases: [], category: 'Media' },
  'clothoff': { name: 'clothoff', desc: 'Cloth off effect', usage: 'clothoff @user', aliases: [], category: 'Fun' },
  'config': { name: 'config', desc: 'Show bot config', usage: 'config', aliases: [], category: 'Utility' },
  'configv2': { name: 'configv2', desc: 'Show config v2', usage: 'configv2', aliases: [], category: 'Utility' },
  'edit': { name: 'edit', desc: 'Edit message', usage: 'edit [new]', aliases: [], category: 'Utility' },
  'file': { name: 'file', desc: 'Send file', usage: 'file [name]', aliases: [], category: 'Utility' },
  'follow': { name: 'follow', desc: 'Follow user', usage: 'follow @user', aliases: [], category: 'Social' },
  'marry': { name: 'marry', desc: 'Marry user', usage: 'marry @user', aliases: ['wed'], category: 'Love' },
};

// Guides
const GUIDES = {
  bank: `🏦 **BANK ACCOUNT**

.openaccount [name] - Account banayein
.deposit [amount] - Coins deposit karein
.withdraw [amount] - Coins nikalen
.mybank - Details dekhein`,
  economy: `💰 **ECONOMY**

.daily - Free coins (50-200)
.balance - Balance dekhein
.work - Coins kamaen
.rankup - Rank badhayein`,
  rankup: `⬆️ **RANKUP SYSTEM**

**Kya hai?**
Rankup se aap apna rank badha sakte hain aur coins earn kar sakte hain!

**Commands:**
.rankup - Check current rank & upgrade

**Ranks:**
• Level 1 → 2: 50 coins
• Level 2 → 3: 100 coins
• Level 3 → 4: 200 coins
• Level 4 → 5: 400 coins
• aur aage badhne ke liye aur zyada coins chahiye honge!

**Fayda:**
✅ Har rank par bonus milta hai
✅ Zyada coins earn karne ka chance`,
  pair: `💕 **PAIR COMMANDS**

**Kya hai?**
Do users ke beech love pair create karta hai!

**Usage:** .pair @user

**Cost:** 10-20 coins (har pair command ka cost alag hai)

⚠️ **Important:** 
• Coins bagair PAIR use NAHI kar sakte!
• .balance se coins check karein
• .daily se free coins le sakte hain

**Pair Variants:**
• .pair → 10 coins
• .pair2 to .pair10 → 10-20 coins`,
  convo: `🔄 **CONVO MODE**

**Kya hai?**
Convo ek automatic message forwarding system hai jo ek group se dosre group mein messages copy karta hai.

**Setup:**
1. Type: .convo on
2. Bot aapse poochega:
   - Source group (jahan se messages aayenge)
   - Target group (jahan jaayenge)
   - Messages count
   - Speed (kitni der mein ek msg jayega)
3. Setup complete hone par convo start!

**Stop:**
Type: .convo off
Phir reply mein number bhejein jo convo stop karni hai!

⚠️ Sirf Admin use kar sakte hain!`,
  bot: `🤖 **RDX BOT - FULL INFO**

**Creator:** SARDAR RDX
**AI:** RDXAI (Mera naam!)
**Version:** Elite V7

**Features:**
✅ Economy System - Coins, Bank, Daily, Work
✅ Love Commands - Pair, Marry, BestFriend
✅ Media - TikTok, Music, Video, GIF
✅ Admin - Kick, Ban, Mute, Convo
✅ Fun - Hack, Slap, Kiss, Flirt
✅ 175+ Commands!

**Prefix:** . (dot)

**Economy Commands:**
.openaccount - Bank account banayein
.deposit - Coins save karein
.withdraw - Coins nikalen
.daily - Free coins (50-200 daily!)

**Popular Commands:**
.tiktok [link] - TikTok download
.music [song] - Music bajayein
.rankup - Rank badhayein
.pair @user - Love pair banayein

DM SARDAR RDX for help!`,
  admin: `🛡️ **ADMIN**

.kick @user - Kick
.ban @user - Ban
.mute @user - Mute
.convo on/off - Convo`,
  tiktok: `🎵 **TIKTOK**

.tiktok [link] - Video download`,
  owner: `👑 **OWNER**

Creator: SARDAR RDX
AI: RDXAI`,
  paymentinfo: `💳 **PRICING**

Pair: 10-20 coins (variant par depend karta hai)
Marry: 250 coins
BestFriend: 100 coins
Pair2-10: 10-20 coins`,
  troubleshooting: `🔧 **TROUBLESHOOTING**

Prefix (.) lagaya?
Admin command?
.openaccount kholen?`
};

// API Configuration
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const API_KEYS = ['csk-f4xm3rmpcyf4v58cntefr6jndtmretfcr54n8jj6efvp6hx9'];
const MODEL_NAME = "llama-3.1-8b";
const HISTORY_FILE = path.join(__dirname, "cache", "rdxai_history.json");

function getRandomApiKey() {
  if (API_KEYS.length === 0) return null;
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

const SYSTEM_PROMPT = `Aap RDXAI hain - SARDAR RDX ka AI Assistant.

**BOT COMMANDS (175+):**
${Object.values(ALL_COMMANDS).map(c => `- ${c.name}: ${c.desc} (${c.usage})`).join('\n')}

**RULES:**
1. Jab user koi bhi command ka naam le, to us command ka EXACT info dein
2. Short aur helpful answers (1-3 lines)
3. Hinglish mein reply karein
4. Emoji use karein

**IMPORTANT:**
- Prefix '.' zaroori hai
- .openaccount zaroori hai economy ke liye
- Paid commands ke liye coins chahiye`;

function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function getUserHistory(userID) {
  ensureHistoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(data[userID]) ? data[userID].slice(-10) : [];
  } catch { return []; }
}

function saveUserHistory(userID, messages) {
  try {
    ensureHistoryFile();
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    data[userID] = messages.slice(-12);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, 'utf8'));
  } catch (err) { }
}

async function getAIResponse(userID, prompt) {
  const history = getUserHistory(userID);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: prompt }
  ];

  try {
    const apiKey = getRandomApiKey();
    if (!apiKey) throw new Error("API Key not found");

    const response = await axios.post(CEREBRAS_API_URL, {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.7,
      max_completion_tokens: 300,
      top_p: 0.9
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    });

    const botReply = response.data.choices[0].message.content;
    saveUserHistory(userID, [...history, { role: "user", content: prompt }, { role: "assistant", content: botReply }]);
    return botReply;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

function formatCommandGuide(cmd, prefix = '.') {
  let info = `📋 **${cmd.name.toUpperCase()} COMMAND**\n\n`;
  info += `📝 **Description:** ${cmd.desc}\n\n`;
  info += `📌 **Usage:** \`${prefix}${cmd.usage}\`\n\n`;
  info += `🏷️ **Category:** ${cmd.category}\n`;
  
  if (cmd.aliases && cmd.aliases.length > 0) {
    info += `⚡ **Aliases:** ${cmd.aliases.map(a => '`' + prefix + a + '`').join(', ')}\n`;
  }
  
  // Add extra info for specific commands
  if (cmd.name === 'convo') {
    info += `\n💡 **How to use:**\n`;
    info += `• ${prefix}convo on - Start convo\n`;
    info += `• ${prefix}convo off - Stop convo\n`;
    info += `• Bot messages automatically copy from one group to another`;
  } else if (cmd.name === 'daily') {
    info += `\n💡 **Reward:** 50-200 coins daily FREE!`;
  } else if (cmd.name === 'tiktok') {
    info += `\n💡 **Example:** ${prefix}tiktok https://vm.tiktok.com/...`;
  } else if (cmd.name === 'pair' || cmd.name.startsWith('pair')) {
    info += `\n💡 **Cost:** 10-20 coins (variant par depend karta hai)\n⚠️ **Important:** Coins bagair use NAHI kar sakte!`;
  } else if (cmd.name === 'rankup') {
    info += `\n💡 **Rankup System:**\n`;
    info += `• Level 1→2: 50 coins\n`;
    info += `• Level 2→3: 100 coins\n`;
    info += `• Level 3→4: 200 coins\n`;
    info += `• Level 4→5: 400 coins\n`;
    info += `✅ Har rank par bonus milta hai!`;
  } else if (cmd.name === 'openaccount' || cmd.name === 'bank') {
    info += `\n💡 **Why Important?**\n`;
    info += `• Group leave hone par coins safe rehte hain\n`;
    info += `• Economy commands ke liye account zaroori hai\n`;
    info += `• ${prefix}deposit se coins save karein\n`;
    info += `• ${prefix}mybank se details dekhein`;
  } else if (cmd.name === 'deposit') {
    info += `\n💡 **Usage:**\n`;
    info += `• ${prefix}deposit 100 (100 coins deposit)\n`;
    info += `• ${prefix}deposit all (sabhi coins deposit)`;
  } else if (cmd.name === 'withdraw') {
    info += `\n💡 **Usage:**\n`;
    info += `• ${prefix}withdraw 100 (100 coins nikalen)\n`;
    info += `• ${prefix}withdraw all (sabhi coins nikalen)`;
  } else if (cmd.name === 'balance') {
    info += `\n💡 **Shows:**\n`;
    info += `• Wallet coins\n`;
    info += `• Bank coins\n`;
    info += `• Total wealth`;
  } else if (cmd.name === 'work') {
    info += `\n💡 **Earn:**\n`;
    info += `• Har work par 10-50 coins milte hain\n`;
    info += `• Different jobs random hoti hain`;
  } else if (cmd.name === 'marry') {
    info += `\n💡 **Cost:** 250 coins\n⚠️ Coins bagair use NAHI kar sakte!`;
  } else if (cmd.name === 'bestfriend' || cmd.name === 'bff') {
    info += `\n💡 **Cost:** 100 coins\n⚠️ Coins bagair use NAHI kar sakte!`;
  } else if (cmd.name === 'tiktok' || cmd.name === 'music' || cmd.name === 'video') {
    info += `\n💡 **No coins required - FREE to use!`;
  }
  
  return info;
}

function detectCommandInMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  // Extract all words from message
  const words = lowerMsg.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 1);
  
  // Check for exact command name match in words
  for (const word of words) {
    if (ALL_COMMANDS[word]) {
      return { type: 'command', command: ALL_COMMANDS[word] };
    }
  }
  
  // Check aliases
  for (const [key, cmd] of Object.entries(ALL_COMMANDS)) {
    for (const alias of cmd.aliases) {
      if (alias && words.includes(alias)) {
        return { type: 'command', command: cmd };
      }
    }
  }
  
  return null;
}

function detectGuideQuery(message) {
  const lowerMsg = message.toLowerCase();
  
  // Check for bot info first
  if (lowerMsg.includes('bot info') || lowerMsg.includes('bot ke features') || 
      lowerMsg.includes('bot ma kia') || lowerMsg.includes('bot me kya') ||
      lowerMsg.includes('what can bot do') || lowerMsg.includes('bot details')) {
    return { type: 'guide', guide: 'bot' };
  }
  
  if (lowerMsg.includes('owner') || lowerMsg.includes('creator') || lowerMsg.includes('sardar')) {
    return { type: 'guide', guide: 'owner' };
  }
  if (lowerMsg.includes('bank') || lowerMsg.includes('account') || lowerMsg.includes('openaccount')) {
    return { type: 'guide', guide: 'bank' };
  }
  if (lowerMsg.includes('rankup') || lowerMsg.includes('rank up') || lowerMsg.includes('rank badhao')) {
    return { type: 'guide', guide: 'rankup' };
  }
  if (lowerMsg.includes('pair') || lowerMsg.includes('jodi') || lowerMsg.includes('couple')) {
    return { type: 'guide', guide: 'pair' };
  }
  if (lowerMsg.includes('convo') || lowerMsg.includes('cycle') || lowerMsg.includes('forward')) {
    return { type: 'guide', guide: 'convo' };
  }
  if (lowerMsg.includes('coins') || lowerMsg.includes('money') || lowerMsg.includes('earn') || lowerMsg.includes('daily')) {
    return { type: 'guide', guide: 'economy' };
  }
  if (lowerMsg.includes('tiktok') || lowerMsg.includes('download')) {
    return { type: 'guide', guide: 'tiktok' };
  }
  if (lowerMsg.includes('admin') || lowerMsg.includes('kick') || lowerMsg.includes('ban')) {
    return { type: 'guide', guide: 'admin' };
  }
  if (lowerMsg.includes('paid') || lowerMsg.includes('cost') || lowerMsg.includes('kitne')) {
    return { type: 'guide', guide: 'paymentinfo' };
  }
  if (lowerMsg.includes('not work') || lowerMsg.includes('error') || lowerMsg.includes('problem')) {
    return { type: 'guide', guide: 'troubleshooting' };
  }
  
  return null;
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'rdxai',
    aliases: ['ai', 'helper'],
    description: 'RDX AI - Smart Assistant',
    usage: 'rdxai [question]',
    category: 'Utility',
    prefix: false
  },

  async run({ api, event, args, send, config }) {
    const { threadID, senderID, messageID, body } = event;
    let userMessage = (args && args.length > 0) ? args.join(" ").trim() : '';

    if (!userMessage) {
      return send.reply(`🤖 **RDX AI Assistant**

Main aapki help ke liye hoon!

🔹 ".rdxai pair" - Pair command ke liye
🔹 ".rdxai tiktok" - TikTok ke liye  
🔹 ".rdxai balance" - Balance ke liye
🔹 Koi bhi command ka naam likho, main info doonga!

Reply bhi de sakte hain! ✨`);
    }

    api.setMessageReaction('⏳', messageID, () => {}, true);

    try {
      // 1. Check if any command is mentioned - PRIORITY
      const cmdMatch = detectCommandInMessage(userMessage);
      if (cmdMatch) {
        const guide = formatCommandGuide(cmdMatch.command, config.PREFIX);
        api.setMessageReaction('✅', messageID, () => {}, true);
        return api.sendMessage(guide, threadID, (err, info) => {
          if (info && info.messageID) {
            global.client.replies.set(info.messageID, { commandName: "rdxai", messageID: info.messageID, author: senderID });
          }
        }, messageID);
      }

      // 2. Check for guide queries
      const guideMatch = detectGuideQuery(userMessage);
      if (guideMatch) {
        const guide = GUIDES[guideMatch.guide];
        if (guide) {
          api.setMessageReaction('✅', messageID, () => {}, true);
          return api.sendMessage(guide, threadID, (err, info) => {
            if (info && info.messageID) {
              global.client.replies.set(info.messageID, { commandName: "rdxai", messageID: info.messageID, author: senderID });
            }
          }, messageID);
        }
      }

      // 3. Use AI for everything else
      const aiResponse = await getAIResponse(senderID, userMessage);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (info && info.messageID) {
          global.client.replies.set(info.messageID, { commandName: "rdxai", messageID: info.messageID, author: senderID });
        }
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  },

  async handleReply({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    const prompt = body.trim();
    if (!prompt) return;

    api.setMessageReaction('💭', messageID, () => {}, true);

    try {
      const aiResponse = await getAIResponse(senderID, prompt);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (info && info.messageID) {
          global.client.replies.set(info.messageID, { commandName: "rdxai", messageID: info.messageID, author: senderID });
        }
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
