export const TIMING = {
  // Availability check intervals
  AVAILABILITY_CHECK_INTERVAL: 10 * 1000, // 10 seconds
  SESSION_DURATION: 15 * 60 * 1000, // 15 minutes

  // Form filling delays
  FORM_FILL_DELAY: 1500, // 1.5 seconds between form selections
  INITIAL_LOAD_DELAY: 2000, // 2 seconds initial page load
  POST_FORM_DELAY: 3000, // 3 seconds after form submission

  // Cloudflare retry settings
  CLOUDFLARE_RETRY_DELAY: 10000, // 10 seconds between retries
  MAX_CLOUDFLARE_RETRIES: 8,

  // Uptime message interval
  UPTIME_MESSAGE_INTERVAL: 30 * 60 * 1000, // 30 minutes

  // Main loop delay
  MAIN_LOOP_DELAY: 30000, // 30 seconds
};
