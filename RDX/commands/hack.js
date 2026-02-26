// hack.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "hack",
  version: "1.0.0",
  hasPermission: 0,
  prefix: true,
  premium: false,
  commandCategory: "group",
  credits: "SARDAR RDX",
  description: "Virtual 'hack' prank on a mentioned user.",
  usages: "@mention",
  dependencies: {
    "axios": "",
    "fs-extra": ""
  },
  cooldowns: 0
};

module.exports.run = async function ({ args, Users, Threads, api, event, Currencies }) {
  const cacheDir = path.join(__dirname, "cache");
  const pathImg = path.join(cacheDir, "hack_result.png");

  // Helper: get name using api.getUserInfo (wrap callback into Promise)
  const getNameFromApi = (userId) => new Promise((resolve) => {
    try {
      api.getUserInfo(userId, (err, userInfo) => {
        if (err) {
          console.error("api.getUserInfo error:", err);
          return resolve(null);
        }
        if (!userInfo || !userInfo[userId] || !userInfo[userId].name) return resolve(null);
        return resolve(userInfo[userId].name);
      });
    } catch (e) {
      console.error("getUserInfo threw:", e);
      return resolve(null);
    }
  });

  try {
    // Determine target user id (mention or sender)
    const mentioned = Object.keys(event.mentions || {});
    const targetId = mentioned.length ? mentioned[0] : event.senderID;

    // Try to get the name via api.getUserInfo
    let targetName = await getNameFromApi(targetId);

    // Fallback: if api.getUserInfo failed to return name, try Users.getNameUser if available
    if (!targetName && typeof Users?.getNameUser === "function") {
      try {
        targetName = await Users.getNameUser(targetId);
      } catch (e) {
        targetName = null;
      }
    }

    // Final fallback
    if (!targetName) targetName = "Unknown";

    // Build API URL (encode values)
    const apiUrl = `http://172.81.128.14:20541/hack?userId=${encodeURIComponent(targetId)}&name=${encodeURIComponent(targetName)}`;

    // Ensure cache folder exists
    await fs.ensureDir(cacheDir);

    // Fetch the PNG from your API
    const res = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    // Validate content-type
    const contentType = (res.headers && res.headers["content-type"]) ? res.headers["content-type"] : "";
    if (!contentType.startsWith("image/")) {
      const text = Buffer.from(res.data).toString("utf8");
      return api.sendMessage(
        `Expected an image but API returned: ${contentType || "unknown"}\n${text.slice(0, 1000)}`,
        event.threadID,
        event.messageID
      );
    }

    // Write image to cache
    fs.writeFileSync(pathImg, Buffer.from(res.data));

    // Prepare message body — mention the hacked user if you prefer, here we include the name
    const bodyText = `Good Luck! Hacked ${targetName}. Password sent to the owner.`;

    // Send message with attachment and cleanup after send
    return api.sendMessage(
      {
        body: bodyText,
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => {
        try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch (e) { }
      },
      event.messageID
    );

  } catch (error) {
    console.error("hack command error:", error);
    const errText = error && error.response
      ? `API error ${error.response.status} ${error.response.statusText}`
      : `Request failed: ${error && error.message ? error.message : String(error)}`;
    return api.sendMessage(`Failed to fetch hack image.\n${errText}`, event.threadID, event.messageID);
  }
};

