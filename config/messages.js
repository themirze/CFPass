export const MESSAGES = {
  // Report Channel Messages
  REPORT: {
    STARTING: "⋆｡‧˚ʚ🍒ɞ˚‧｡⋆\n🤖 Starting...\n⋆｡‧˚ʚ🍒ɞ˚‧｡⋆",
    CLOUDFLARE_SUCCESS: "✅ Cloudflare bypassed successfully!",
    CLOUDFLARE_RETRY: "🔄 Retrying...",
    CLOUDFLARE_ERROR: "🔄 Cloudflare bypass err: {error}, {retryCount}. trying again...",
    CLOUDFLARE_FAILED: "❌ Cloudflare bypass {maxRetries} times failed.",
    FORM_NOT_FOUND: "❌ Form not found",
    FORM_ELEMENT_NOT_FOUND: "❌ Element not found: {selector}",
    FORM_ERROR: "❌ Form error: {error}",
    CAPTCHA_FAILED: "❌ Captcha failed",
    MAIN_LOOP_ERROR: "❌ Main loop error: {error}",
    AVAILABILITY_CHECK:
      "= Availability Check Response === \n Status Code: {status}\nisAvailable: {isAvailable}\n================================",
  },

  // Appointment Channel Messages
  APPOINTMENT: {
    AVAILABLE: "⊹︵︵︵ ⊹  ୨ 🕊️ ୧  ⊹ ︵︵︵ ⊹\nAppointment Available\n⊹︵︵︵ ⊹  ୨ 🕊️ ୧  ⊹ ︵︵︵ ⊹",
  },

  // Common Messages
  COMMON: {
    BOT_ACTIVE: "🤖 Bot online",
    ERROR: "❌ We have an error: {error}",
  },
};
