import { connect } from "puppeteer-real-browser";
import { sendMessage, getMessage } from "./modules/telegram.mjs";
import { downloadCaptcha } from "./modules/captcha.mjs";
import { fillAppointmentForm } from "./modules/appointment.mjs";

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

async function checkAlertClass(page) {
  const availableDayInfo = await page.$("#availableDayInfo");
  if (availableDayInfo) {
    try {
      const alertDiv = await availableDayInfo.$("div");
      if (alertDiv) {
        const alertClass = await alertDiv.evaluate((el) => el.getAttribute("class"));
        if (alertClass && alertClass.includes("alert-info")) {
          const message = `${getCurrentTime()} | ${getMessage("appointment_available")}`;
          console.log(message);
          await sendMessage(message);
        } else {
          console.log(`${getCurrentTime()} | ❌ Əlçatan tarix yoxdur.`);
        }
      }
    } catch (error) {
      console.log(`${getCurrentTime()} | ❌ Əlçatan tarix yoxdur.`);
    }
  } else {
    console.log(`${getCurrentTime()} | ❌ Əlçatan tarix yoxdur.`);
  }
}

async function keepAliveOnFormPage(page) {
  console.log("🕒 Form səhifəsində 19 dəqiqə aktiv qalma rejimi başladı...");
  const startTime = Date.now();
  const personValues = ["1", "2"];
  let currentIndex = 0;

  while (Date.now() - startTime < 19 * 60 * 1000) {
    try {
      const personSelector = await page.$("#totalPerson");
      if (personSelector) {
        await personSelector.select(personValues[currentIndex]);
        console.log(`🔁 Ərizəçi sayı dəyişdi: ${personValues[currentIndex]}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await checkAlertClass(page);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        currentIndex = 1 - currentIndex;
      } else {
        console.log("❌ #totalPerson elementi tapılmadı.");
        break;
      }
    } catch (error) {
      console.log(`⚠️ Ərizəçi sayını dəyişərkən xəta: ${error.message}`);
      break;
    }
  }
}

async function checkAppointment(page) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const captchaText = await downloadCaptcha(page);
    if (captchaText) {
      if (await fillAppointmentForm(page)) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await keepAliveOnFormPage(page);
      }
    } else {
      await sendMessage(`${getCurrentTime()} | ${getMessage("captcha_failed")}`);
    }
  } catch (error) {
    const errorMessage = `${getCurrentTime()} | ⚠️ Xəta baş verdi: ${error.message}`;
    console.log(errorMessage);
    await sendMessage(errorMessage);
  }
}

(async () => {
  try {
    await sendMessage(`${getCurrentTime()} | ${getMessage("starting")}`);

    const { browser, page } = await connect({
      headless: false,
      turnstile: true,
      fingerprint: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    while (true) {
      try {
        await page.goto("http://az-appointment.visametric.com/az", { waitUntil: "networkidle2" });

        console.log("📄 Bypassing Cloudflare...");
        await sendMessage("📄 Cloudflare bypass ediliyor...");

        await new Promise((resolve) => setTimeout(resolve, 20000));

        const title = await page.title();
        console.log("Sayfa Başlığı:", title);

        const cookies = await page.cookies();
        const cfClearance = cookies.find((c) => c.name === "cf_clearance");

        if (cfClearance) {
          console.log("✅ Cloudflare bypass edildi");
          await sendMessage(getMessage("cloudflare_bypassed"));
          await checkAppointment(page);
        } else {
          console.log("❌ Cloudflare bypass edilemedi");
          await sendMessage(getMessage("cloudflare_failed"));
        }

        console.log(`\n${"=" * 50}`);
        console.log(`Sonraki kontrol için 30 saniye bekleniyor... (${getCurrentTime()})`);
        console.log(`${"=" * 50}\n`);
        await new Promise((resolve) => setTimeout(resolve, 30000));
      } catch (error) {
        console.log(`❌ Ana döngüde hata: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }
  } catch (error) {
    console.error("❌ Beklenmeyen hata:", error);
    await sendMessage(`${getCurrentTime()} | ${getMessage("error", { error: error.message })}`);
  }
})();
