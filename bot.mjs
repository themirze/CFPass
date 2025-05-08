import { connect } from "puppeteer-real-browser";
import { sendMessage } from "./modules/telegram.mjs";
import { downloadCaptcha } from "./modules/captcha.mjs";
import { fillAppointmentForm, monitorAvailability } from "./modules/appointment.mjs";
import { TIMING } from "./config/timing.js";
import { MESSAGES } from "./config/messages.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_FOLDER = path.join(__dirname, "img");

let startTime = null;
let lastUptimeMessage = 0;

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUptime() {
  if (!startTime) return "";
  const uptime = Date.now() - startTime;
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  return `\n🕒 Çalışma Süresi: ${hours} saat ${minutes} dakika`;
}

async function sendUptimeIfNeeded() {
  const now = Date.now();
  if (now - lastUptimeMessage >= TIMING.UPTIME_MESSAGE_INTERVAL) {
    await sendMessage(`${MESSAGES.COMMON.BOT_ACTIVE}${getUptime()}`);
    lastUptimeMessage = now;
  }
}

function cleanImgFolder() {
  try {
    if (fs.existsSync(IMG_FOLDER)) {
      const files = fs.readdirSync(IMG_FOLDER);
      for (const file of files) {
        fs.unlinkSync(path.join(IMG_FOLDER, file));
      }
      console.log("✅ Captcha görüntüleri temizlendi");
    }
  } catch (error) {
    console.error("❌ Captcha görüntüleri temizlenirken hata:", error);
  }
}

async function checkAppointment(page) {
  try {
    await new Promise((resolve) => setTimeout(resolve, TIMING.INITIAL_LOAD_DELAY));

    const captchaText = await downloadCaptcha(page);
    if (captchaText) {
      cleanImgFolder();
      if (await fillAppointmentForm(page)) {
        await new Promise((resolve) => setTimeout(resolve, TIMING.POST_FORM_DELAY));
        const isAvailable = await monitorAvailability(page);
        if (!isAvailable) {
          return false;
        }
      }
    } else {
      await sendMessage(MESSAGES.REPORT.CAPTCHA_FAILED);
    }
    return true;
  } catch (error) {
    await sendMessage(MESSAGES.REPORT.MAIN_LOOP_ERROR.replace("{error}", error.message));
    return false;
  }
}

async function retryCloudflare(page) {
  let retryCount = 0;

  while (retryCount < TIMING.MAX_CLOUDFLARE_RETRIES) {
    try {
      await page.goto("http://az-appointment.visametric.com/az", { waitUntil: "networkidle2" });
      const cookies = await page.cookies();
      const cfClearance = cookies.find((c) => c.name === "cf_clearance");

      if (cfClearance) {
        await sendMessage(MESSAGES.REPORT.CLOUDFLARE_SUCCESS);
        return true;
      } else {
        retryCount++;
        if (retryCount < TIMING.MAX_CLOUDFLARE_RETRIES) {
          await sendMessage(MESSAGES.REPORT.CLOUDFLARE_RETRY.replace("{retryCount}", retryCount));
          await new Promise((resolve) => setTimeout(resolve, TIMING.CLOUDFLARE_RETRY_DELAY));
        }
      }
    } catch (error) {
      retryCount++;
      if (retryCount < TIMING.MAX_CLOUDFLARE_RETRIES) {
        await sendMessage(
          MESSAGES.REPORT.CLOUDFLARE_ERROR.replace("{error}", error.message).replace("{retryCount}", retryCount)
        );
        await new Promise((resolve) => setTimeout(resolve, TIMING.CLOUDFLARE_RETRY_DELAY));
      }
    }
  }

  await sendMessage(MESSAGES.REPORT.CLOUDFLARE_FAILED.replace("{maxRetries}", TIMING.MAX_CLOUDFLARE_RETRIES));
  return false;
}

(async () => {
  try {
    startTime = Date.now();
    lastUptimeMessage = startTime;
    await sendMessage(MESSAGES.REPORT.STARTING);

    const { browser, page } = await connect({
      headless: false,
      turnstile: true,
      fingerprint: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    while (true) {
      try {
        await sendUptimeIfNeeded();

        if (await retryCloudflare(page)) {
          const shouldContinue = await checkAppointment(page);
          if (!shouldContinue) {
            continue;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, TIMING.MAIN_LOOP_DELAY));
      } catch (error) {
        await sendMessage(MESSAGES.REPORT.MAIN_LOOP_ERROR.replace("{error}", error.message));
        await new Promise((resolve) => setTimeout(resolve, TIMING.MAIN_LOOP_DELAY));
      }
    }
  } catch (error) {
    await sendMessage(MESSAGES.COMMON.ERROR.replace("{error}", error.message));
  }
})();
