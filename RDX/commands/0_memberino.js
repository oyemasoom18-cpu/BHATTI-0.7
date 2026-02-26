const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'memberinfo',
    aliases: ['minfo', 'userinfo', 'info', 'whois'],
    description: 'Get detailed member information',
    usage: 'memberinfo [@mention] or reply to someone',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Users, config }) {
    const { senderID, mentions, threadID, messageReply } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Sirf bot admin ye command use kar sakta hai.');
    }
    
    let targetUID = null;
    
    if (Object.keys(mentions).length > 0) {
      targetUID = Object.keys(mentions)[0];
    } else if (messageReply) {
      targetUID = messageReply.senderID;
    } else if (args[0] && /^\d+$/.test(args[0])) {
      targetUID = args[0];
    } else {
      targetUID = senderID;
    }
    
    try {
      await send.reply('⏳ Member info fetch ho rahi hai...');
      
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(targetUID, (err, info) => {
          if (err) reject(err);
          else resolve(info[targetUID] || {});
        });
      });
      
      const name = userInfo.name || 'Unknown';
      const firstName = userInfo.firstName || '';
      const alternateName = userInfo.alternateName || '';
      const vanity = userInfo.vanity || '';
      const profileUrl = userInfo.profileUrl || `https://facebook.com/${targetUID}`;
      const isFriend = userInfo.isFriend ? 'Han ✅' : 'Nahi ❌';
      const isBirthday = userInfo.isBirthday ? 'Aaj Birthday hai! 🎂' : 'Nahi';
      
      let gender = 'Unknown';
      if (userInfo.gender === 1) gender = 'Female 👩';
      else if (userInfo.gender === 2) gender = 'Male 👨';
      else gender = 'Not Specified';
      
      let mutualFriendsInfo = '';
      let mutualCount = 0;
      let mutualWithAdmin = false;
      
      try {
        const adminFriendsForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: 'RelayModern',
          fb_api_req_friendly_name: 'FriendingCometFriendsListPaginatedQuery',
          variables: JSON.stringify({
            id: senderID,
            orderType: 'default',
            scale: 1,
            count: 500
          }),
          server_timestamps: true,
          doc_id: '4268740419858498'
        };
        
        const adminFriendsRes = await api.httpPost('https://www.facebook.com/api/graphql/', adminFriendsForm);
        let adminFriends = [];
        
        try {
          const adminFriendsData = JSON.parse(adminFriendsRes.replace('for (;;);', ''));
          const edges = adminFriendsData?.data?.node?.friends?.edges || [];
          adminFriends = edges.map(e => ({
            id: e?.node?.id,
            name: e?.node?.name
          })).filter(f => f.id);
        } catch (e) {}
        
        const targetFriendsForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: 'RelayModern',
          fb_api_req_friendly_name: 'FriendingCometFriendsListPaginatedQuery',
          variables: JSON.stringify({
            id: targetUID,
            orderType: 'default',
            scale: 1,
            count: 500
          }),
          server_timestamps: true,
          doc_id: '4268740419858498'
        };
        
        const targetFriendsRes = await api.httpPost('https://www.facebook.com/api/graphql/', targetFriendsForm);
        let targetFriends = [];
        
        try {
          const targetFriendsData = JSON.parse(targetFriendsRes.replace('for (;;);', ''));
          const edges = targetFriendsData?.data?.node?.friends?.edges || [];
          targetFriends = edges.map(e => ({
            id: e?.node?.id,
            name: e?.node?.name
          })).filter(f => f.id);
        } catch (e) {}
        
        const adminFriendIds = new Set(adminFriends.map(f => f.id));
        const mutualFriends = targetFriends.filter(f => adminFriendIds.has(f.id));
        
        mutualCount = mutualFriends.length;
        mutualWithAdmin = true;
        
        if (mutualCount > 0) {
          mutualFriendsInfo = '\n\n👥 𝗔𝗽𝗸𝗲 𝗠𝘂𝘁𝘂𝗮𝗹 𝗙𝗿𝗶𝗲𝗻𝗱𝘀:\n';
          const topMutuals = mutualFriends.slice(0, 5);
          for (const mutual of topMutuals) {
            mutualFriendsInfo += `   • ${mutual.name}\n     ↳ UID: ${mutual.id}\n`;
          }
          if (mutualCount > 5) {
            mutualFriendsInfo += `   ... aur ${mutualCount - 5} aur mutual friends`;
          }
        }
      } catch (e) {
        mutualFriendsInfo = '';
        mutualWithAdmin = false;
      }
      
      if (!mutualWithAdmin || mutualCount === 0) {
        try {
          const mutualForm = {
            av: api.getCurrentUserID(),
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'ProfileCometMutualFriendsTabContentRefetchQuery',
            variables: JSON.stringify({
              id: targetUID,
              scale: 1
            }),
            server_timestamps: true,
            doc_id: '5765643083517052'
          };
          
          const mutualRes = await api.httpPost('https://www.facebook.com/api/graphql/', mutualForm);
          const mutualData = JSON.parse(mutualRes.replace('for (;;);', ''));
          
          let edges = mutualData?.data?.node?.mutual_friends?.edges || [];
          let botMutualCount = edges.length;
          
          if (botMutualCount > 0 && mutualCount === 0) {
            mutualCount = botMutualCount;
            mutualFriendsInfo = '\n\n👥 𝗕𝗼𝘁 𝗞𝗲 𝗠𝘂𝘁𝘂𝗮𝗹 𝗙𝗿𝗶𝗲𝗻𝗱𝘀:\n';
            const topMutuals = edges.slice(0, 5);
            for (const edge of topMutuals) {
              const mutualName = edge?.node?.name || 'Unknown';
              const mutualUID = edge?.node?.id || '';
              mutualFriendsInfo += `   • ${mutualName}\n     ↳ UID: ${mutualUID}\n`;
            }
            if (botMutualCount > 5) {
              mutualFriendsInfo += `   ... aur ${botMutualCount - 5} aur`;
            }
          }
        } catch (e) {}
      }
      
      let joinDate = '';
      try {
        const profileForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: 'RelayModern',
          fb_api_req_friendly_name: 'ProfileCometAboutAppSectionQuery',
          variables: JSON.stringify({
            userID: targetUID,
            scale: 1
          }),
          server_timestamps: true,
          doc_id: '7565670896828001'
        };
        
        const profileRes = await api.httpPost('https://www.facebook.com/api/graphql/', profileForm);
        const profileData = JSON.parse(profileRes.replace('for (;;);', ''));
        
        const registrationTime = profileData?.data?.user?.registration_time;
        if (registrationTime) {
          const date = new Date(registrationTime * 1000);
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          joinDate = date.toLocaleDateString('en-US', options);
        }
      } catch (e) {
        joinDate = '';
      }
      
      let profilePicUrl = '';
      
      try {
        const hdPicForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: 'RelayModern',
          fb_api_req_friendly_name: 'CometSinglePhotoContentQuery',
          variables: JSON.stringify({
            nodeID: targetUID,
            scale: 3
          }),
          server_timestamps: true,
          doc_id: '6547808121926498'
        };
        
        const hdPicRes = await api.httpPost('https://www.facebook.com/api/graphql/', hdPicForm);
        const hdPicData = JSON.parse(hdPicRes.replace('for (;;);', ''));
        
        profilePicUrl = hdPicData?.data?.node?.viewer_image?.uri ||
                        hdPicData?.data?.node?.image?.uri || '';
      } catch (e) {}
      
      if (!profilePicUrl) {
        try {
          const picForm = {
            av: api.getCurrentUserID(),
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'ProfileCometHeaderQuery',
            variables: JSON.stringify({
              userID: targetUID,
              scale: 3
            }),
            server_timestamps: true,
            doc_id: '4159355184147969'
          };
          
          const picRes = await api.httpPost('https://www.facebook.com/api/graphql/', picForm);
          const picData = JSON.parse(picRes.replace('for (;;);', ''));
          
          profilePicUrl = picData?.data?.user?.profile_picture?.uri ||
                          picData?.data?.user?.profilePicLarge?.uri ||
                          picData?.data?.user?.profile_photo?.image?.uri || '';
        } catch (e) {}
      }
      
      if (!profilePicUrl) {
        profilePicUrl = `https://graph.facebook.com/${targetUID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      }
      
      let infoMsg = `👤 𝗠𝗘𝗠𝗕𝗘𝗥 𝗜𝗡𝗙𝗢
━━━━━━━━━━━━━━━━━

📛 𝗡𝗮𝗺𝗲: ${name}`;

      if (firstName && firstName !== name) {
        infoMsg += `\n   ↳ First Name: ${firstName}`;
      }
      if (alternateName) {
        infoMsg += `\n   ↳ Alternate: ${alternateName}`;
      }
      
      infoMsg += `

🆔 𝗨𝗜𝗗: ${targetUID}

⚧️ 𝗚𝗲𝗻𝗱𝗲𝗿: ${gender}

🔗 𝗣𝗿𝗼𝗳𝗶𝗹𝗲: ${profileUrl}`;

      if (vanity) {
        infoMsg += `\n   ↳ Username: @${vanity}`;
      }

      infoMsg += `

🤝 𝗙𝗿𝗶𝗲𝗻𝗱: ${isFriend}

🎂 𝗕𝗶𝗿𝘁𝗵𝗱𝗮𝘆: ${isBirthday}`;

      if (mutualCount > 0) {
        if (mutualWithAdmin) {
          infoMsg += `\n\n👥 𝗔𝗽𝗸𝗲 𝗠𝘂𝘁𝘂𝗮𝗹 𝗙𝗿𝗶𝗲𝗻𝗱𝘀: ${mutualCount}`;
        } else {
          infoMsg += `\n\n👥 𝗠𝘂𝘁𝘂𝗮𝗹 𝗙𝗿𝗶𝗲𝗻𝗱𝘀: ${mutualCount}`;
        }
      }

      if (joinDate) {
        infoMsg += `\n\n📅 𝗙𝗕 𝗝𝗼𝗶𝗻 𝗗𝗮𝘁𝗲: ${joinDate}`;
      }

      infoMsg += mutualFriendsInfo;

      infoMsg += `

━━━━━━━━━━━━━━━━━
𝗥𝗗𝗫 𝗠𝗲𝗺𝗯𝗲𝗿 𝗜𝗻𝗳𝗼 𝗦𝘆𝘀𝘁𝗲𝗺`;

      if (profilePicUrl) {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const imagePath = path.join(cacheDir, `memberinfo_${targetUID}.jpg`);
        
        try {
          const imageResponse = await axios.get(profilePicUrl, { 
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 5
          });
          fs.writeFileSync(imagePath, imageResponse.data);
          
          await api.sendMessage({
            body: infoMsg,
            attachment: fs.createReadStream(imagePath)
          }, threadID, () => {
            try {
              fs.unlinkSync(imagePath);
            } catch (e) {}
          });
        } catch (imgErr) {
          await send.reply(infoMsg);
        }
      } else {
        await send.reply(infoMsg);
      }
      
    } catch (error) {
      return send.reply('❌ Member info nahi mil saki: ' + error.message);
    }
  }
};

