import { sendMessage } from "./modules/telegram.mjs";

(async () => {
  try {
    console.log("Testing Telegram API...");
    const result = await sendMessage("Test mesajı - Telegram API testi");
    if (result) {
      console.log("✅ Telegram API testi başarılı!");
    } else {
      console.log("❌ Telegram API testi başarısız!");
    }
  } catch (error) {
    console.error("Test sırasında hata:", error);
  }
})();
