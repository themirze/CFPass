import config from "../config.json" assert { type: "json" };
import messages from "../messages.json" assert { type: "json" };
import axios from "axios";

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.botToken}`;

export async function sendMessage(message, isAppointment = false) {
  try {
    const channelId = isAppointment ? config.telegram.appointmentChannelId : config.telegram.reportChannelId;

    console.log("Sending message to Telegram...");
    console.log("Bot Token:", config.telegram.botToken);
    console.log("Channel ID:", channelId);
    console.log("Message:", message);
    console.log("Message Type:", isAppointment ? "Appointment" : "Report");

    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: channelId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    console.log("Telegram API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Telegram API Error Details:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Response Data:", error.response?.data);
    console.error("Error Message:", error.message);
    return null;
  }
}

export function getMessage(key, params = {}) {
  let message = messages[key] || key;
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value);
  });
  return message;
}
