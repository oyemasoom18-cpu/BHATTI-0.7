const axios = require('axios');

const dayTranslations = {
  'Sunday': 'Sunday',
  'Monday': 'Monday',
  'Tuesday': 'Tuesday',
  'Wednesday': 'Wednesday',
  'Thursday': 'Thursday',
  'Friday': 'Friday',
  'Saturday': 'Saturday'
};

const weatherTranslations = {
  'sunny': 'Sunny',
  'mostly sunny': 'Mostly Sunny',
  'partly sunny': 'Partly Sunny',
  'rain showers': 'Rain Showers',
  't-storms': 'Thunderstorms',
  'light rain': 'Light Rain',
  'mostly cloudy': 'Mostly Cloudy',
  'rain': 'Rainy',
  'heavy t-storms': 'Severe Thunderstorms',
  'partly cloudy': 'Partly Cloudy',
  'mostly clear': 'Mostly Clear',
  'cloudy': 'Cloudy',
  'clear': 'Clear Sky'
};

const translateWeather = (weather) => {
  const normalizedWeather = weather.toLowerCase();
  if (weatherTranslations[normalizedWeather]) {
    return weatherTranslations[normalizedWeather];
  } else {
    console.log(`No translation found for weather status: ${weather}`);
    return weather; // Keep original if not found
  }
};

const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

module.exports.config = {
  name: 'weather',
  version: '1.0.0',
  hasPermission: 0,
  credits: "SARDAR RDX",
  description: "Check weather for any city globally.",
  commandCategory: 'Members',
  usages: [],
  cooldowns: 3,
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const location = args.join(" ");
    if (!location) return api.sendMessage("༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**Enter the city/province to check the weather.**\n\n༻﹡﹡﹡﹡﹡﹡﹡༺", event.threadID);

    const res = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURI(location)}`);
    if (!res.data || res.data.length === 0) {
      return api.sendMessage("≿━━━━༺❀༻━━━━≾\n\n**No weather data found for this location.**\n\n≿━━━━༺❀༻━━━━≾", event.threadID);
    }

    const data = res.data[0];
    const { location: loc, current, forecast } = data;

    if (!forecast || forecast.length === 0) {
      return api.sendMessage("⚝──⭒─⭑─⭒──⚝\n\n**No weather forecast data available for this location.**\n\n⚝──⭒─⭑─⭒──⚝", event.threadID);
    }

    let message = `≿━━━━༺❀༻━━━━≾\n\n**Current weather in ${loc.name}:**\n` +
                  `🌡 **Temperature:** ${current.temperature}°C\n` +
                  `🤲 **Feels Like:** ${current.feelslike}°C\n` +
                  `🗺️ **Condition:** ${translateWeather(current.skytext)}\n` +
                  `♒ **Humidity:** ${current.humidity}%\n` +
                  `💨 **Wind:** ${current.winddisplay}\n\n` +
                  `❤ **React with heart to view the 3-day forecast.**\n\n≿━━━━༺❀༻━━━━≾`;

    api.sendMessage(message, event.threadID, (err, info) => {
      if (err) return;
      if (!global.client.handleReaction) {
        global.client.handleReaction = [];
      }
      global.client.handleReaction.push({
        name: this.config.name,
        messageID: info.messageID,
        location: loc.name,
        forecast: forecast,
        author: event.senderID
      });
    });

  } catch (err) {
    api.sendMessage(`༻﹡﹡﹡﹡﹡﹡﹡༺\n\n**An error occurred while fetching weather data: ${err.message}**\n\n༻﹡﹡﹡﹡﹡﹡﹡༺`, event.threadID);
  }
};

module.exports.handleReaction = async function({ event, api, handleReaction: reaction, Users }) {
  if (event.userID != reaction.author) return;
  if (event.reaction != "❤") return; 

  const { location, forecast } = reaction;

  const today = new Date();
  const nextFiveDays = [];
  for (let i = 0; i < forecast.length; i++) {
    const forecastDate = new Date(forecast[i].date);
    if (forecastDate >= today && nextFiveDays.length < 5) {
      nextFiveDays.push(forecast[i]);
    }
  }

  if (nextFiveDays.length === 0) {
    return api.sendMessage("⚝──⭒─⭑─⭒──⚝\n\n**No forecast data available for the next 3 days.**\n\n⚝──⭒─⭑─⭒──⚝", event.threadID);
  }

  let message = `≿━━━━༺❀༻━━━━≾\n\n**3-Day Weather Forecast for ${location}:**\n`;

  for (let i = 0; i < nextFiveDays.length; i++) {
    const day = dayTranslations[nextFiveDays[i].day] || nextFiveDays[i].day;
    const weather = translateWeather(nextFiveDays[i].skytextday);
    const date = formatDate(nextFiveDays[i].date);

    message += `${i + 1}. **${day} - ${date}**\n` +
               `🌡 **Temperature:** ${nextFiveDays[i].low}°C ➝ ${nextFiveDays[i].high}°C\n` +
               `🗺️ **Forecast:** ${weather}\n` +
               `🌧 **Precipitation:** ${nextFiveDays[i].precip}%\n\n`;
  }

  message += "≿━━━━༺❀༻━━━━≾";

  api.sendMessage(message, event.threadID);
  
  // Unsend the old current weather message
  try {
    api.unsendMessage(reaction.messageID);
  } catch (err) {
    console.error('Failed to unsend old weather message:', err);
  }
};
