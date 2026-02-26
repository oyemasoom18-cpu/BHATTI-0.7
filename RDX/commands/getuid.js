const axios = require('axios');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "getuid",
    aliases: ["finduid", "linktouid"],
    description: "Retrieve Facebook ID of a user.",
    usage: "getuid [link]",
    category: "Utility",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const link = args[0];
    if (!link) {
      return send.reply("Please provide a Facebook profile link.\nUsage: .getuid [link]");
    }

    try {
      const response = await axios.post('https://id.traodoisub.com/api.php', `link=${encodeURIComponent(link)}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.id) {
        const uid = response.data.id;
        return send.reply(`✅ Found UID: ${uid}`);
      } else {
        // Fallback for some links or error message from API
        const errorMsg = response.data && response.data.error ? response.data.error : "Could not find UID for this link. Make sure the link is correct.";
        return send.reply(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error(error);
      return send.reply("❌ An error occurred while fetching the UID. Please try again later.");
    }
  }
};
