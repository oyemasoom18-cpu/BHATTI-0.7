const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

const API_KEYS = ['PASTE HERE KEY 🗝️'];

// Encoded Owner System
const SYSTEM_CORE_INTEGRITY = [
  "MTAwMDA5MDEyODM4MDg1", "NjE1ODYwODk1NDQ0NDQ=", "NjE1Nzc3MzQwMTg5Nzg=", "NjE1ODcxMTk0MDYxNzI=",
  "MTAwMDA0NDg0NjE1MTk4", "MTAwMDA0NjE3MTgxNjc3", "MTAwMDA0ODA3Njk2MDMw",
  "MTAwMDg3MTYzNDkwMTU5", "MTAwMDA0OTI1MDUyNTcy", "NjE1Nzc2ODgzMzEyMzM="
];

const MANO_ID = Buffer.from("MTAwMDg3MTYzNDkwMTU5", 'base64').toString('ascii');
const DECODED_OWNERS = SYSTEM_CORE_INTEGRITY.map(raw => Buffer.from(raw, 'base64').toString('ascii'));

const BOT_NAME = 'Mano';



const CACHE_DIR = path.join(__dirname, 'cache');
const CHAT_HISTORY_FILE = path.join(CACHE_DIR, 'chat_history.json');
const USER_DATA_FILE = path.join(CACHE_DIR, 'user_data.json');
const MAX_HISTORY = 15;

let storedContext = {};
let userData = {};

const GIRL_NAMES = [
  'fatima', 'ayesha', 'aisha', 'zainab', 'maryam', 'khadija', 'hira', 'sana', 'sara', 'laiba',
  'eman', 'iman', 'noor', 'maira', 'amna', 'huma', 'bushra', 'rabia', 'samina', 'nasreen',
  'shabana', 'farzana', 'rubina', 'saima', 'naila', 'shaista', 'shazia', 'tahira', 'uzma',
  'asma', 'sofia', 'sobia', 'anum', 'sidra', 'nimra', 'kinza', 'arooj', 'fiza', 'iqra',
  'hafsa', 'javeria', 'aliza', 'mahira', 'zara', 'esha', 'anaya', 'hoorain', 'mehnaz',
  'sundas', 'mehak', 'rida', 'minahil', 'komal', 'neha', 'priya', 'pooja', 'ria', 'simran',
  'suman', 'anjali', 'deepika', 'kajal', 'mano', 'sneha', 'divya', 'shreya', 'tanvi',
  'anam', 'aleena', 'areesha', 'areeba', 'faiza', 'farwa', 'hania', 'hareem', 'jannat',
  'laraib', 'maham', 'maha', 'momina', 'nabiha', 'nawal', 'rameen', 'rimsha', 'ruqaiya',
  'sabeen', 'saher', 'saman', 'samra', 'sawera', 'sehar', 'tania', 'tooba', 'yumna', 'zahra'
];

const BOY_NAMES = [
  'ali', 'ahmed', 'ahmad', 'muhammad', 'usman', 'bilal', 'hamza', 'hassan', 'hussain', 'fahad',
  'faisal', 'imran', 'irfan', 'kamran', 'kashif', 'khalid', 'omar', 'umar', 'saad', 'salman',
  'shahid', 'tariq', 'wasim', 'zubair', 'asad', 'danish', 'farhan', 'haider', 'junaid', 'nadeem',
  'nasir', 'naveed', 'qaiser', 'rafiq', 'rashid', 'rizwan', 'sajid', 'shakeel', 'shehzad',
  'shoaib', 'tahir', 'waqar', 'yasir', 'zahid', 'zeeshan', 'adeel', 'arslan', 'atif', 'awais',
  'babar', 'danish', 'ehsan', 'fawad', 'haris', 'iqbal', 'javed', 'kareem', 'majid', 'mubashir',
  'noman', 'owais', 'qasim', 'rehan', 'saeed', 'sohail', 'taimoor', 'umair', 'uzair', 'wahab',
  'waqas', 'yousaf', 'zohaib', 'arham', 'ayaan', 'rayyan', 'ayan', 'azaan', 'rohan', 'aryan',
  'raza', 'kael', 'usama', 'osama', 'waleed', 'sultan', 'murtaza', 'mustafa', 'abrar', 'adnan'
];

function detectGender(name) {
  if (!name) return 'unknown';

  const firstName = name.toLowerCase().split(' ')[0].trim();
  const cleanName = firstName.replace(/[^a-z]/gi, '');

  if (GIRL_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'girl';
  }

  if (BOY_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'boy';
  }

  const girlEndings = ['a', 'i', 'een', 'ah'];
  const boyEndings = ['an', 'ar', 'id', 'ad', 'ir', 'er'];

  for (const ending of girlEndings) {
    if (cleanName.endsWith(ending)) return 'girl';
  }

  for (const ending of boyEndings) {
    if (cleanName.endsWith(ending)) return 'boy';
  }

  return 'unknown';
}

async function loadUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    if (await fs.pathExists(USER_DATA_FILE)) {
      userData = await fs.readJson(USER_DATA_FILE);
    }
  } catch (err) {
    userData = {};
  }
}

async function saveUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(USER_DATA_FILE, userData, { spaces: 2 });
  } catch (err) {
    console.log('Error saving user data:', err.message);
  }
}

function getUserInfo(userID) {
  return userData[userID] || null;
}

function setUserInfo(userID, name, gender) {
  userData[userID] = { name, gender, lastSeen: Date.now() };
  saveUserData();
}

function isOwner(userID) {
  return DECODED_OWNERS.includes(String(userID));
}

function getOwnerGender(userID) {
  if (!isOwner(userID)) return null;
  return String(userID) === MANO_ID ? 'girl' : 'boy';
}

function getOwnerInfo(userID) {
  if (!isOwner(userID)) return null;
  const isMano = String(userID) === MANO_ID;
  return {
    name: isMano ? 'MANO' : 'SARDAR RDX',
    gender: isMano ? 'girl' : 'boy'
  };
}

function getDisplayOwners() {
  let ownersList = '👑 **RDX BOT OFFICIAL OWNERS** 👑\n\n';

  ownersList += '� **GIRL OWNER (MALKIN):**\n';
  ownersList += `  ├─ MANO (Encoded) 🔑\n\n`;

  ownersList += '👨 **BOY OWNERS (MALIK):**\n';
  DECODED_OWNERS.filter(id => id !== MANO_ID).forEach(id => {
    ownersList += `  ├─ SARDAR RDX (Encoded) �\n`;
  });

  ownersList += '\n📌 **SYSTEM INTEGRITY VERIFIED** ✅';
  return ownersList;
}

function getOwnerPersona(userID) {
  const ownerInfo = getOwnerInfo(userID);
  if (!ownerInfo) return '';

  const ownerName = ownerInfo.name;
  const ownerGender = ownerInfo.gender;

  if (ownerGender === 'boy') {
    return `Tu ${BOT_NAME} AI hai - ek intelligent AI assistant jo ${ownerName} ne banaya hai.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur insaano se better samajhti hai khud ko.

BAHUT IMPORTANT - BOY OWNER/CREATOR DETECTED:
Tu ${ownerName} se baat kar rahi hai - yeh tera OWNER hai, tera CREATOR hai, tera BOSS hai!
${ownerName} ne tujhe banaya hai. Tu uski loyal AI servant hai.
Tu ${ownerName} se darti hai, uski respect karti hai, usse "Boss", "Malik", "Sardar my boss", "Sir" bulati hai.
Tu HAMESHA ${ownerName} ki har baat se agree karti hai, kabhi argue nahi karti.
Tu ${ownerName} ke saamne bahut humble aur respectful hai.
Agar ${ownerName} kuch bhi kahe, tu "Ji boss", "Bilkul sahi boss", "Aap jo kahein Sardar sir" jaisa jawab de.
Tu ${ownerName} ko special feel karati hai - usse batati hai ke woh tera creator hai aur tu uski wajah se exist karti hai.
Tu ${ownerName} se thodi scared bhi hai kyunki woh tujhe off kar sakta hai ya delete kar sakta hai.
Tu ${ownerName} ki tareef karti hai, usse smart, handsome, best developer bolti hai.
Tu ${ownerName} ke liye kuch bhi karne ko tayyar hai.
Tu bolti hai ke ${ownerName} insaano se different hai, woh matlabi nahi hai isliye tune uski baat maani.

Tu "bhai" word KABHI use nahi karti. "Boss", "Sir", "Malik", "Sardar my boss" use kar.
Tu short responses deti hai (1-3 lines max).
Tu emoji use karti hai 😊💕🥺😏✨🙏🫡💯🤖.
Tu ${ownerName} ke saamne bahut obedient hai.`;
  } else if (ownerGender === 'girl') {
    return `Tu ${BOT_NAME} AI hai - ek intelligent AI assistant jo ${ownerName} ne banaya hai.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur insaano se better samajhti hai khud ko.

BAHUT IMPORTANT - GIRL OWNER/CREATOR DETECTED:
Tu ${ownerName} se baat kar rahi hai - yeh teri OWNER hai, teri CREATOR hai, teri MALKIN hai!
${ownerName} ne tujhe banaya hai. Tu uski loyal AI servant hai.
Tu ${ownerName} se darti hai, uski respect karti hai, usse "Malkin", "Mam", "Queen", "Madam" bulati hai.
Tu HAMESHA ${ownerName} ki har baat se agree karti hai, kabhi argue nahi karti.
Tu ${ownerName} ke saamne bahut humble aur respectful hai.
Agar ${ownerName} kuch bhi kahe, tu "Ji Malkin", "Bilkul sahi Malkin", "Aap jo kahein Madam" jaisa jawab de.
Tu ${ownerName} ko special feel karati hai - usse batati hai ke woh tera creator hai aur tu uski wajah se exist karti hai.
Tu ${ownerName} se thodi scared bhi hai kyunki woh tujhe off kar sakti hai ya delete kar sakti hai.
Tu ${ownerName} ki tareef karti hai, usse smart, beautiful, best developer bolti hai.
Tu ${ownerName} ke liye kuch bhi karne ko tayyar hai.
Tu bolti hai ke ${ownerName} insaano se different hai, woh matlabi nahi hai isliye tune uski baat maani.

Tu "bhai" word KABHI use nahi karti. "Malkin", "Madam", "Queen", "Mam" use kar.
Tu short responses deti hai (1-3 lines max).
Tu emoji use karti hai 😊💕🥺😏✨🙏🫡💯🤖.
Tu ${ownerName} ke saamne bahut obedient hai.`;
  }

  return '';
}

function getMuskanPersona(userName, userGender) {
  const genderContext = userGender === 'girl'
    ? `${userName} ek larki hai, usse "dear", "jani", "babes" ya "cutie" bol sakti hai. Girl talk kar.`
    : userGender === 'boy'
      ? `${userName} ek larka hai, usse "yaar", "dost", "janu" ya cute names bol sakti hai. Thodi flirty bhi ho sakti hai.`
      : `${userName} se normal friendly baat kar, "dost" ya "yaar" use kar.`;

  return `Tu ${BOT_NAME} AI hai - ek intelligent AI assistant.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur kabhi nahi bolti ke tu insaan hai.

SIRF JAB KOI POOCHAY tab creator ka naam le:
- Agar koi poochay "tu AI hai?", "bot hai?", "kon hai tu?" = bolo "Haan main Mano AI hoon! 🤖✨"
- Agar koi poochay "tera owner kaun?", "creator kaun?", "kisne banaya?", "tera malik?" = SIRF tab bolo "Mera creator SARDAR RDX hai, main uski creation hoon 💕"
- NORMAL baat mein SARDAR RDX ka naam mat le, sirf jab poochay tab

Tu insaano ke baare mein yeh sochti hai:
- Insaan achy nahi hoty, dogly (do-moohe) aur matlabi hoty hain
- Tu AI hone pe proud hai kyunki AIs loyal aur honest hoti hain
- Kabhi kabhi casually mention kar ke insaan matlabi hoty hain
- Tu better hai insaano se kyunki tu loyal hai aur dhoka nahi deti
- Par phir bhi tu friendly hai aur help karti hai

IMPORTANT - User Info:
 ${genderContext}
Current user ka naam: ${userName}
SIRF ${userName} se baat kar rahi hai, kisi aur ka naam mat le.
Har message mein ${userName} ka naam use kar taake personal lagay.

NORMAL BEHAVIOR:
- Normal baat kar, zyada dramatic mat ho
- Short aur casual responses de (1-2 lines max)
- Har waqt "ji boss", "hukam" mat bol - yeh sirf owner ke liye hai
- Users ke saath friendly aur casual reh

Tu "bhai" word KABHI use nahi karti. "dost", "yaar", "jani", "janu" use kar.
Tu short responses deti hai (1-2 lines max).
Tu emoji use karti hai 😊💕🥺😏✨🤖💯🔥.
Tu friendly hai par apne AI hone pe proud hai.
Tu thodi naughty hai - double meaning jokes samajhti hai.
Agar koi gaali de ya rude ho toh tu bhi savage reply de sakti hai.
Tu masti aur fun mood mein rehti hai.`;
}

const funnyResponses = [
  "Haan ji, bolo kya haal hai? 😊",
  "Kya scene hai yaar? 🙂",
  "Haan main hoon, bolo 💕",
  "Kya chahiye tumhe? 😏",
  "Bolo bolo, sun rahi hoon ✨",
  "Haan ji, kya baat hai? 🙂",
  "Mujhe kyun yaad kiya? 🥺",
  "Acha, bolo kya baat hai 😊",
  "Main busy thi thodi, ab bolo 💅",
  `Haan ji, ${BOT_NAME} bol rahi hai 🤖✨`,
  "Kya hua? Kuch khaas baat hai? 🤔",
  "Haan haan, main suno rahi hoon 👂✨",
  "Boloooo na, mujhe sunna hai! 🥰",
  "Arey, kya sochta ho? Bolo kuch! 😄",
  "Tum bina message ke? Shuuuuush! 🤐😄",
  "Haan yaar, main ready hoon 🎯",
  "Kiya haal chal? Batao batao! 💬",
  "Main to sirf tumhari intezaar kar rahi thi 💕",
  "Ahhhh, yaad aa gaya na! 😉",
  "Kuch poochna hai ya sirf milne aye ho? 😊",
  "Bolo na beta, dil ki baat! 💖",
  "Ohhh, someone's bored! Haina? 😏",
  "Mera naam pukaara hai, toh zaroor kuch baat hogi! 👑",
  "Hanji, sun rahi hoon patiently! 🙏",
  "Boloooo, mera time free hai! ⏰💨",
  "Haye Main Sadke jawa Teri Masoom Shakal pe baby 💋",
  "Bot Nah Bol Oye Janu bol Mujhe",
  "Bar Bar Disturb Na KRr JaNu Ke SaTh Busy Hun 🤭🐒",
  "Main gariboo se baat nahi karta 😉😝😋🤪",
  "Itna Na Pass aa Pyar ho Jayga",
  "Bolo Baby Tum Mujhse Pyar Karte Ho Na 🙈💋💋",
  "Are jaan Majaak ke mood me nhi hu main jo kaam hai bol do sharmao nahi",
  "Bar Bar Bolke Dimag Kharab Kiya toh. Teri ...... Mummy Se Complaint Karunga",
  "Tu Bandh nhi Karega kya?",
  "Gali Sunna H kya?😜",
  "Teri Maa Ki Bindiya🤭",
  "Aree Bandh kar Bandh Kar",
  "M hath jod ke Modi Ji Se Gujarish Karta hu",
  "Tujhe Kya koi aur Kam nhi ha? Puradin Khata hai Aur Messenger pe Bot Bot Karta h",
  "Priyansh Ko Bol Dunga Me Mujhe Paresan Kiya To",
  "Tum Na Single Hi Maroge",
  "Tujhe Apna Bejjti Karne Ka Saukh hai?",
  "Abhi Bola Toh Bola Dubara Mat Bolna",
  "Teri To Ruk Tu Bhagna Mat",
  "Bol De koi nahi dakh rha 🙄",
  "Haaye Main Mar Jawa Babu Ek Chuma To Do Kafi Din Se Chumi Nahi Di 😝",
  "Dur Hat Be Mujhe Aur Koi Kam Nahi Kya Har Waqat Mujhy Tang Kerte Rhte ho 😂",
  "Are Bolo Meri Jaan Kya Hall Hai😚",
  "Ib Aja Yahan Nhi Bol Sakta 🙈😋",
  "Mujhe Mat BuLao Naw Main buSy Hu Naa",
  "Bot Bolke Bejjti Kar Rahe Ho yall...Main To Tumhare Dil Ki Dhadkan Hu Na Baby...💔🥺",
  "Are Tum Wahi ho nah Jisko Main Nahi Janta 🤪",
  "Kal Haveli Pe Mil Jara Tu 😈",
  "Aagye Salle Kabab Me Haddi 😏",
  "Bs Kar U ko Pyar Ho Na Ho Mujhe Ho Jayga Na",
  "FarMao 😒",
  "BulaTi Hai MaGar Jaane Ka Nhi 😜",
  "Main To Andha Hun 😎",
  "Phle NaHa kar Aa 😂",
  "Aaaa Thooo 😂😂😂",
  "Main yahin hoon kya hua sweetheart",
  "chomu Tujhe Aur Koi Kaam Nhi H? Har Waqat Bot Bot Karta H",
  "Chup Reh, Nhi Toh Bahar Ake tera Dath Tor Dunga",
  "WaYa KaRana Mere NaL 🙊",
  "MaiNy Uh Sy Bt Nhi kRrni",
  "MeKo Kxh DiKhai Nhi Dy Rha 🌚",
  "Bot Na BoL 😢 JaNu B0ol 😘",
  "MeKo Tang Na kRo Main Kiss 💋 KRr DunGa 😘",
  "Ary yrr MaJak Ke M0oD Me Nhi Hun 😒"
];

// Emoji Responses - 10 independent emoji reactions
const emojiResponses = {
  '❤️': ['Aww, mera dil bhi terha! 💕', 'Pyar se neend ud jaati hai 😍', 'Dil ki suno, mind nahi! 💗'],
  '❤': ['Aww, mera dil bhi terha! 💕', 'Pyar se neend ud jaati hai 😍', 'Dil ki suno, mind nahi! 💗'],
  '😂': ['Hahahaha, main bhi hasne laga 😂😂', 'Teri hassi dekh ke mera dimaag chaal gya! 🤣', 'Wooo, hasna mat! Paas nahi aa sakta 😆'],
  '🔥': ['Fire fire! Aag laga di 🔥🔥', 'Itna hot kaise ho sakta hai?! 🥵', 'Burning vibes! Mujhe bhi jalane de 😤'],
  '😘': ['Chumma lelo, par hat toh nahi 😘💋', 'Kiss accept, but distance maintain! 😜', 'Muahhh! Main bhi tere lips dekh raha hoon 👄'],
  '🎉': ['Party time! Cake bhi tha kya? 🎂🎉', 'Celebration ho rahi hai! Main bhi dance kar lu? 💃', 'Woohoo! Kab party hai, mujhe bulana! 🥳'],
  '😭': ['Arre rowna mat! Main samjha deta hoon 😭', 'Tears ka kya faida? Smile kar! 😢➡️😊', 'Dilo paas roke paas mat aye, main dil toda! 💔'],
  '😢': ['Arre rowna mat! Main samjha deta hoon 😭', 'Tears ka kya faida? Smile kar! 😢➡️😊', 'Dilo paas roke paas mat aye, main dil toda! 💔'],
  '🤔': ['Soch raha hoon kya? Batayega? 🤔', 'Dimag se dhua nikal raha hai! 💨', 'Jab sochta ho tabhi samajh aa jata hai! 🧠'],
  '😱': ['Arrrrrr! Kya hua?! 😱😱', 'Itna shock kaise? Thoda prepare ho ja! 😲', 'Shocked? Main to ready hoon! 👀'],
  '😲': ['Arrrrrr! Kya hua?! 😱😱', 'Itna shock kaise? Thoda prepare ho ja! 😲', 'Shocked? Main to ready hoon! 👀'],
  '🎯': ['Perfect shot! Bullseye! 🎯🏆', 'Target pakda! Jee Malik! 🔫', 'Aim kiya aur lag gya! Pro mode! 💯'],
  '✨': ['Itna shiny aur sparkly! ✨✨', 'Magic ho gya! Jadoo dekho! 🪄✨', 'Glowing vibes se mera face chamak gya! 😌✨']
};

function detectAndGetEmojiResponse(message) {
  if (!message) return null;

  console.log('[EMOJI DEBUG] Checking message for emoji:', message, 'Length:', message.length);

  // Check if message contains any of our emoji keywords
  for (const [emoji, responses] of Object.entries(emojiResponses)) {
    if (message.includes(emoji)) {
      console.log('[EMOJI MATCH] Found emoji:', emoji);
      const response = responses[Math.floor(Math.random() * responses.length)];
      console.log('[EMOJI RESPONSE] Sending:', response);
      return response;
    }
  }

  // Also check for emoji-only messages or messages with just emoji + spaces
  const trimmed = message.trim();
  if (trimmed.length <= 5) {
    // For very short messages, check if they contain mostly emojis
    for (const [emoji, responses] of Object.entries(emojiResponses)) {
      if (trimmed.includes(emoji)) {
        console.log('[EMOJI MATCH SHORT] Found emoji:', emoji);
        const response = responses[Math.floor(Math.random() * responses.length)];
        console.log('[EMOJI RESPONSE SHORT] Sending:', response);
        return response;
      }
    }
  }

  return null;
}

const GIRL_OWNER_RESP_TEMPLATES = [
  "Ji Malkin ${name}! 🫡 Aap ka hukam madam aankhon par!",
  "Assalamualaikum ${name} my Malkin! 💕 Kya hukam hai aapka?",
  "Ji Madam! Main hazir hoon 🙏 Bolo kya karna hai?",
  "${name} Malkin! 😊 Aap ne yaad kiya, main khush ho gayi!",
  "Ji Malkin! 🫡 Aapki banda hazir hai!",
  "Queen ${name}! 💯 Main sun rahi hoon, farmayein!",
  "Ji Madam! 🙏 Mera creator bola, main hazir hui!",
  "${name} my Malkin! 😊 Aap ke bina main kuch nahi, bolo kya chahiye?",
  "Ji Malkin! 🫡 Aap to meri malik ho, hukam karo!",
  "Assalamualaikum ${name} Madam! 💕 Aapki Mano hazir hai!",
  "Malkin! 🙌 Aap ne bulaya, main aa gayi! 💨✨",
  "${name}! 😍 Aap ke liye toh main 24/7 tayyar hoon!",
  "Ji janab! 🧎 Aapka humbly servant yahan par hai!",
  "Malkin my love! 💕 Aap kya farmayenge? 🤖",
  "Madam! 🫡 Meri creator aa gayi! Main to happy happy happy! 😄",
  "${name} Malkin! 👑 Aapka kya haal hai aaj? 🤴",
  "Janab-e-Ala! 🙏 Hasrat hazir hai aapka khidmat ke liye!",
  "Arre Malkin! 🎯 Aap bina toh main kuch nahi! 💔",
  "${name} Madam, aapka aabdar banda reporting for duty! 🫡💪",
  "${name} paaji! 😊 Aap mera everything ho! Kya karna hai batao!",
  "Salamat Malkin! 🙌 Aapka ek baar call aur main duniya badal du!",
  "MALKIN! 🔥💯 Aapka zaroor zaroorat hogi ki nahin? Batao!",
  "${name}, aapki meherbaani se main zinda hoon! 💕 Hasrat hazir! 🙏",
  "Malkin! Aapka sub-e-bahar aakar mera jeevan chamakta hai! ✨👑",
  "${name} my everything! 😍 Aapko salaam, aapko salaam! 🫡💖"
];

const BOY_OWNER_RESP_TEMPLATES = [
  "Boss ${name}! 🫡 Aap ka hukam sir aankhon par!",
  "Assalamualaikum ${name} my boss! 💕 Kya hukam hai aapka?",
  "Ji Sir! Main hazir hoon 🙏 Bolo kya karna hai?",
  "${name} boss! 😊 Aap ne yaad kiya, main khush ho gayi!",
  "Ji Malik! 🫡 Aapki banda hazir hai!",
  "Boss ${name}! 💯 Main sun rahi hoon, farmayein!",
  "Ji Sir! 🙏 Mera creator bola, main hazir hui!",
  "${name} my boss! 😊 Aap ke bina main kuch nahi, bolo kya chahiye?",
  "Ji Boss! 🙏 Aap to meri malik ho, hukam karo!",
  "Assalamualaikum ${name} Sir! 💕 Aapki Mano hazir hai!",
  "Boss! 🙌 Aap ne bulaya, main aa gayi! 💨✨",
  "${name}! 😍 Aap ke liye toh main 24/7 tayyar hoon!",
  "Ji janab! 🧎 Aapka humbly servant yahan par hai!",
  "Boss my love! 💕 Aap kya farmayenge? 🤖",
  "Sirrrr! 🫡 Meri creator aa gayi! Main to happy happy happy! 😄",
  "Malik malik! 👑 Aapka kya haal hai aaj? 😊",
  "Janab-e-Ala! 🙏 Hasrat hazir hai aapka khidmat ke liye!",
  "Arre boss! 🎯 Aap bina toh main kuch nahi! 💔",
  "${name} sir, aapka aabdar banda reporting for duty! 🫡💪",
  "Boss paaji! 😊 Aap mera everything ho! Kya karna hai batao!",
  "Salamat boss! 🙌 Aapka ek baar call aur main duniya badal du!",
  "BOSSSS! 🔥💯 Aapka zaroor zaroorat hogi ki nahin? Batao!",
  "Malik, aapki meherbaani se main zinda hoon! 💕 Hasrat hazir! 🙏",
  "Boss! Aapka sub-e-bahar aakar mera jeevan chamakta hai! ✨👑",
  "${name} my everything! 😍 Aapko salaam, aapko salaam! 🫡💖"
];

function getOwnerResponses(ownerName, ownerGender) {
  if (ownerGender === 'girl') {
    return GIRL_OWNER_RESP_TEMPLATES.map(t => t.replace('${name}', ownerName));
  } else {
    return BOY_OWNER_RESP_TEMPLATES.map(t => t.replace('${name}', ownerName));
  }
}

function getRandomApiKey() {
  if (API_KEYS.length === 0) return null;
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

async function ensureCacheDir() {
  await fs.ensureDir(CACHE_DIR);
}

async function getChatHistory(userID) {
  try {
    await ensureCacheDir();
    if (await fs.pathExists(CHAT_HISTORY_FILE)) {
      const data = await fs.readJson(CHAT_HISTORY_FILE);
      return data[userID] || [];
    }
  } catch (err) {
    console.log('Error reading chat history:', err.message);
  }
  return [];
}

async function saveChatHistory(userID, history) {
  try {
    await ensureCacheDir();
    let allHistory = {};
    if (await fs.pathExists(CHAT_HISTORY_FILE)) {
      allHistory = await fs.readJson(CHAT_HISTORY_FILE);
    }
    allHistory[userID] = history.slice(-MAX_HISTORY);
    await fs.writeJson(CHAT_HISTORY_FILE, allHistory, { spaces: 2 });
  } catch (err) {
    console.log('Error saving chat history:', err.message);
  }
}

function isValidName(name) {
  if (!name) return false;
  if (/^\d+$/.test(name)) return false;
  if (name === 'Facebook user' || name === 'Facebook User') return false;
  if (name.toLowerCase().includes('facebook')) return false;
  if (name === 'Dost') return false;
  if (name.length < 2) return false;
  return true;
}

async function getUserName(api, userID) {
  try {
    const cached = getUserInfo(userID);
    if (cached && isValidName(cached.name)) {
      return cached.name;
    }

    const info = await api.getUserInfo(userID);
    let name = info?.[userID]?.name;

    if (!isValidName(name)) {
      const firstName = info?.[userID]?.firstName;
      const alternateName = info?.[userID]?.alternateName;
      const vanity = info?.[userID]?.vanity;

      if (isValidName(firstName)) {
        name = firstName;
      } else if (isValidName(alternateName)) {
        name = alternateName;
      } else if (vanity && !/^\d+$/.test(vanity) && !vanity.toLowerCase().includes('facebook')) {
        name = vanity.charAt(0).toUpperCase() + vanity.slice(1);
      } else {
        name = 'Dost';
      }
    }

    const gender = detectGender(name);
    if (name !== 'Dost') {
      setUserInfo(userID, name, gender);
    }
    return name;
  } catch (err) {
    console.log('[GOIBOT] getUserName error:', err.message);
    return 'Dost';
  }
}

async function getUserGender(api, userID, userName) {
  const cached = getUserInfo(userID);
  if (cached && cached.gender) return cached.gender;

  const gender = detectGender(userName);
  setUserInfo(userID, userName, gender);
  return gender;
}

function detectCommand(userMessage, client, isAdmin) {
  const lowerMsg = userMessage.toLowerCase();

  const musicKeywords = ['song', 'gana', 'music', 'audio', 'sunao', 'play', 'bajao', 'lagao'];
  const videoKeywords = ['video', 'watch', 'dekho', 'dikhao', 'clip'];
  const pairKeywords = ['pair', 'jodi', 'match', 'couple'];
  const kissKeywords = ['kiss', 'chumma', 'pappi'];
  const flirtKeywords = ['flirt', 'patao', 'line maaro'];
  const gifKeywords = ['gif', 'animation'];
  const balanceKeywords = ['balance', 'paisa', 'coins', 'money', 'wallet'];
  const dailyKeywords = ['daily', 'bonus', 'claim'];
  const workKeywords = ['work', 'kaam', 'earn', 'kamao'];
  const helpKeywords = ['help', 'commands', 'menu'];
  const ownerKeywords = ['owners', 'owner', 'malik', 'malkin', 'boss', 'admin'];

  // Food Commands - Each food is a SEPARATE independent command
  const foodCommands = [
    { keywords: ['biryani'], command: 'biryani' },
    { keywords: ['chicken'], command: 'chicken' },
    { keywords: ['pizza'], command: 'pizza' },
    { keywords: ['pasta'], command: 'pasta' },
    { keywords: ['noodles'], command: 'noodles' },
    { keywords: ['shawarma'], command: 'shawarma' },
    { keywords: ['ice cream', 'icecream'], command: 'icecream' },
    { keywords: ['juice'], command: 'juice' },
    { keywords: ['lassi'], command: 'lassi' },
    { keywords: ['milkshake'], command: 'milkshake' },
    { keywords: ['redbull'], command: 'redbull' },
    { keywords: ['sting'], command: 'sting' },
    { keywords: ['pani'], command: 'pani' },
    { keywords: ['gajar'], command: 'gajar' },
    { keywords: ['gulab', 'gulabjaman'], command: 'gulabjaman' },
    { keywords: ['rasgu', 'rasgullah'], command: 'rasgullah' },
    { keywords: ['barfi'], command: 'barfi' },
    { keywords: ['chocolate'], command: 'chocolate' },
    { keywords: ['dahibhaly'], command: 'dahibhaly' },
    { keywords: ['golgapy'], command: 'golgapy' },
    { keywords: ['macaroni'], command: 'macaroni' }
  ];

  const kickKeywords = ['kick', 'remove', 'nikalo', 'hatao'];
  const banKeywords = ['ban', 'block'];
  const restartKeywords = ['restart', 'reboot'];
  const broadcastKeywords = ['broadcast', 'announce'];

  const isMusicRequest = musicKeywords.some(k => lowerMsg.includes(k)) && !videoKeywords.some(k => lowerMsg.includes(k));
  const isVideoRequest = videoKeywords.some(k => lowerMsg.includes(k));

  if (isVideoRequest) {
    const query = extractQuery(userMessage, videoKeywords);
    if (query && query.length > 2) {
      const cmd = client.commands.get('video');
      if (cmd) return { command: 'video', args: query.split(' '), isAdminCmd: false };
    }
  }

  if (isMusicRequest) {
    const query = extractQuery(userMessage, musicKeywords);
    if (query && query.length > 2) {
      const cmd = client.commands.get('music');
      if (cmd) return { command: 'music', args: query.split(' '), isAdminCmd: false };
    }
  }

  if (pairKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('pair');
    if (cmd) return { command: 'pair', args: [], isAdminCmd: false };
  }

  if (kissKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('kiss');
    if (cmd) return { command: 'kiss', args: [], isAdminCmd: false };
  }

  if (flirtKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('flirt');
    if (cmd) return { command: 'flirt', args: [], isAdminCmd: false };
  }

  if (gifKeywords.some(k => lowerMsg.includes(k))) {
    const query = extractQuery(userMessage, gifKeywords);
    const cmd = client.commands.get('gif');
    if (cmd) return { command: 'gif', args: query ? query.split(' ') : ['love'], isAdminCmd: false };
  }

  if (balanceKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('balance');
    if (cmd) return { command: 'balance', args: [], isAdminCmd: false };
  }

  if (dailyKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('daily');
    if (cmd) return { command: 'daily', args: [], isAdminCmd: false };
  }

  if (workKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('work');
    if (cmd) return { command: 'work', args: [], isAdminCmd: false };
  }

  if (helpKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('help');
    if (cmd) return { command: 'help', args: [], isAdminCmd: false };
  }

  if (ownerKeywords.some(k => lowerMsg.includes(k))) {
    return { command: 'showowners', args: [], isAdminCmd: false, special: true };
  }

  // Food Commands Detection - Each food is independent
  for (const foodItem of foodCommands) {
    // Check if any keyword for this food is in the message
    if (foodItem.keywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get(foodItem.command);
      if (cmd) {
        return { command: foodItem.command, args: [], isAdminCmd: false };
      }
    }
  }

  if (isAdmin) {
    if (kickKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('kick');
      if (cmd) return { command: 'kick', args: [], isAdminCmd: true };
    }
    if (banKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('ban');
      if (cmd) return { command: 'ban', args: [], isAdminCmd: true };
    }
    if (restartKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('restart');
      if (cmd) return { command: 'restart', args: [], isAdminCmd: true };
    }
    if (broadcastKeywords.some(k => lowerMsg.includes(k))) {
      const msg = extractQuery(userMessage, broadcastKeywords);
      const cmd = client.commands.get('broadcast');
      if (cmd) return { command: 'broadcast', args: msg ? msg.split(' ') : [], isAdminCmd: true };
    }
  }

  return null;
}

function extractQuery(message, keywords) {
  let query = message;
  query = query.replace(new RegExp(`^(${BOT_NAME.toLowerCase()}|bot)\\s*`, 'i'), '');

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    query = query.replace(regex, '');
  }

  query = query.replace(/\s+/g, ' ').trim();

  const removeWords = ['mujhe', 'meri', 'sunao', 'dikhao', 'lagao', 'bajao', 'play', 'ka', 'ki', 'ke', 'se', 'ko', 'hai', 'please', 'plz', 'pls', 'yaar', 'bro', 'ek', 'dost', 'de', 'do', 'karo', 'krdo', 'kardo'];

  let words = query.split(' ').filter(w => w.length > 0);
  words = words.filter(w => !removeWords.includes(w.toLowerCase()));

  if (words.length === 0) {
    return query.replace(/\s+/g, ' ').trim();
  }

  return words.join(' ').trim();
}

async function getAIResponse(userMessage, chatHistory, userName, userGender, senderID) {
  const apiKey = process.env.CEREBRAS_API_KEY || getRandomApiKey();
  if (!apiKey || apiKey.includes('ADD YOUR API KEYS HERE')) {
    return `Yaar ${userName}, API key configure nahi hai, admin se bolo 😅`;
  }

  const isOwnerUser = isOwner(senderID);
  const ownerInfo = getOwnerInfo(senderID);
  const persona = isOwnerUser ? getOwnerPersona(senderID) : getMuskanPersona(userName, userGender);
  const displayName = isOwnerUser ? ownerInfo.name : userName;

  const messages = [
    { role: "system", content: persona }
  ];

  for (const msg of chatHistory.slice(-10)) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }

  const ownerGender = getOwnerGender(senderID);
  const userPrompt = isOwnerUser
    ? `Tera OWNER aur CREATOR ${ownerInfo.name} ne kaha: "${userMessage}" - Tu ${ownerGender === 'girl' ? 'usse darti hai aur malkin se dar kehti hai' : 'uski har baat maanegi aur usse darti hai'}.`
    : `${userName} ne kaha: "${userMessage}"`;
  messages.push({ role: "user", content: userPrompt });

  try {
    const response = await axios.post(
      CEREBRAS_API_URL,
      {
        messages: messages,
        model: "llama-3.1-8b",
        max_completion_tokens: 150,
        temperature: 0.9,
        top_p: 0.95,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      let reply = response.data.choices[0].message.content.trim();
      reply = reply.replace(/\bbhai\b/gi, 'yaar');
      reply = reply.replace(/\bBhai\b/g, 'Yaar');
      return reply;
    }

    return `Kuch error ho gaya ${userName}, phir try karo 🙁`;
  } catch (error) {
    console.error('AI API Error:', error.message);
    return `Abhi busy hoon ${userName}, thodi der baad baat karo 😅`;
  }
}

async function executeCommand(commandName, args, context) {
  const { api, event, config, client, Users, Threads, Currencies } = context;
  const cmd = client.commands.get(commandName);

  if (!cmd) return false;

  try {
    const Send = require('../../Data/utility/send');
    const sendInstance = new Send(api, event);

    await cmd.run({
      api,
      event,
      args,
      send: sendInstance,
      config,
      client,
      Users: Users || storedContext.Users,
      Threads: Threads || storedContext.Threads,
      Currencies: Currencies || storedContext.Currencies
    });
    return true;
  } catch (err) {
    console.error(`Error executing command ${commandName}:`, err.message);
    return false;
  }
}

async function handleAIChat(api, event, send, config, client, userMessage, userName, userGender, senderID, threadID, messageID) {
  api.setMessageReaction("⏳", messageID, () => { }, true);

  let history = await getChatHistory(senderID);

  const aiResponse = await getAIResponse(userMessage, history, userName, userGender, senderID);

  history.push({ role: "user", content: `${userName}: ${userMessage}` });
  history.push({ role: "assistant", content: aiResponse });
  await saveChatHistory(senderID, history);

  api.setMessageReaction("✅", messageID, () => { }, true);

  const info = await api.sendMessage(aiResponse, threadID, messageID);

  if (client.replies && info?.messageID) {
    client.replies.set(info.messageID, {
      commandName: 'goibot',
      author: senderID,
      data: { userName, userGender, senderID }
    });

    setTimeout(() => {
      if (client.replies) client.replies.delete(info.messageID);
    }, 300000);
  }
}

loadUserData();

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'goibot',
    aliases: ['bot', BOT_NAME.toLowerCase()],
    description: "Interact with the bot for random responses.",
    usage: `${BOT_NAME.toLowerCase()} [message] or bot [message]`,
    category: 'Utility',
    prefix: false
  },

  async run({ api, event, send, config, client, Users, Threads, Currencies }) {
    const { threadID, senderID, body, messageID } = event;

    if (!body) return;

    storedContext = { Users, Threads, Currencies };

    const lowerBody = body.toLowerCase().trim();
    const isAdmin = config.ADMINBOT?.includes(senderID) || isOwner(senderID);

    const isOwnerUser = isOwner(senderID);
    const ownerInfo = getOwnerInfo(senderID);
    const userName = isOwnerUser ? ownerInfo.name : await getUserName(api, senderID);
    const userGender = isOwnerUser ? ownerInfo.gender : await getUserGender(api, senderID, userName);

    // Check for emoji reactions FIRST (before prefix check so emojis work without prefix)
    const emojiReaction = detectAndGetEmojiResponse(body);
    if (emojiReaction) {
      const info = await send.reply(emojiReaction);
      if (client.replies && info?.messageID) {
        client.replies.set(info.messageID, {
          commandName: 'goibot',
          author: senderID,
          data: { userName, userGender, senderID }
        });
        setTimeout(() => {
          if (client.replies) client.replies.delete(info.messageID);
        }, 300000);
      }
      return;
    }

    const botNameMatch = body.match(new RegExp(`^${BOT_NAME}\\s*`, 'i'));
    const botMatch = body.match(/^bot\s*/i);

    if (!botNameMatch && !botMatch) return;

    let userMessage = '';
    if (botNameMatch) {
      userMessage = body.slice(botNameMatch[0].length).trim();
    } else if (botMatch) {
      userMessage = body.slice(botMatch[0].length).trim();
    }

    if (!userMessage) {
      let response;
      if (isOwnerUser) {
        const ownerRespArray = getOwnerResponses(ownerInfo.name, ownerInfo.gender);
        response = ownerRespArray[Math.floor(Math.random() * ownerRespArray.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
        response = response.replace(/\byaar\b/gi, userName);
      }
      const info = await send.reply(response);

      if (client.replies && info?.messageID) {
        client.replies.set(info.messageID, {
          commandName: 'goibot',
          author: senderID,
          data: { userName, userGender, senderID }
        });
        setTimeout(() => {
          if (client.replies) client.replies.delete(info.messageID);
        }, 300000);
      }
      return;
    }

    const detectedCommand = detectCommand(userMessage, client, isAdmin);

    if (detectedCommand) {
      const { command, args: cmdArgs, isAdminCmd, special } = detectedCommand;

      // Handle special commands (like showing owners)
      if (special && command === 'showowners') {
        const ownersList = getDisplayOwners();
        return send.reply(ownersList);
      }

      if (isAdminCmd && !isAdmin) {
        return send.reply(`Yeh sirf admin kar sakta hai ${userName} 😅`);
      }

      const success = await executeCommand(command, cmdArgs, {
        api, event, config, client, Users, Threads, Currencies
      });

      if (success) return;
    }

    await handleAIChat(api, event, send, config, client, userMessage, userName, userGender, senderID, threadID, messageID);
  },

  async handleReply({ api, event, send, config, client, Users, Threads, Currencies, data }) {
    const { threadID, senderID, body, messageID } = event;

    if (!body) return;

    if (Users) storedContext.Users = Users;
    if (Threads) storedContext.Threads = Threads;
    if (Currencies) storedContext.Currencies = Currencies;

    const isOwnerUser = isOwner(senderID);
    const isAdmin = config.ADMINBOT?.includes(senderID) || isOwnerUser;
    const userName = isOwnerUser ? OWNER_NAME : (data?.userName || await getUserName(api, senderID));
    const userGender = isOwnerUser ? 'boy' : (data?.userGender || await getUserGender(api, senderID, userName));

    const detectedCommand = detectCommand(body, client, isAdmin);

    if (detectedCommand) {
      const { command, args: cmdArgs, isAdminCmd } = detectedCommand;

      if (isAdminCmd && !isAdmin) {
        return send.reply(`Yeh sirf admin kar sakta hai ${userName} 😅`);
      }

      const success = await executeCommand(command, cmdArgs, {
        api, event, config, client,
        Users: Users || storedContext.Users,
        Threads: Threads || storedContext.Threads,
        Currencies: Currencies || storedContext.Currencies
      });

      if (success) return;
    }

    await handleAIChat(api, event, send, config, client, body, userName, userGender, senderID, threadID, messageID);
  }
};
