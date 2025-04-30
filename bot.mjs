import { connect } from "puppeteer-real-browser";
import fs from "fs";

(async () => {
  const { browser, page } = await connect({
    headless: false,
    turnstile: true,
    fingerprint: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  await page.goto("http://az-appointment.visametric.com/az", { waitUntil: "networkidle2" });

  console.log("📄 Sayfa yüklendi. CAPTCHA varsa otomatik geçilmeye çalışılıyor...");

  await new Promise((resolve) => setTimeout(resolve, 20000)); // 20 saniye bekle

  const title = await page.title();
  console.log("Sayfa Başlığı:", title);

  const cookies = await page.cookies();
  const cfClearance = cookies.find((c) => c.name === "cf_clearance");

  if (cfClearance) {
    console.log("✅ CAPTCHA muhtemelen GEÇİLDİ. cf_clearance bulundu.");
  } else {
    console.log("❌ CAPTCHA geçilemedi veya cookie atanmadı.");
  }

  fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
  console.log("💾 Cookie'ler 'cookies.json' dosyasına kaydedildi.");

  console.log("🟢 Tarayıcı açık bırakıldı. CTRL+C ile manuel kapatabilirsin.");
  process.stdin.resume(); // Script kapanmasın
})();
