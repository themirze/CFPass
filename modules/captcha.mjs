import { sendMessage, getMessage } from "./telegram.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_FOLDER = path.join(__dirname, "../img");
const TESSERACT_PATH = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";

// Ensure img directory exists
if (!fs.existsSync(IMG_FOLDER)) {
  fs.mkdirSync(IMG_FOLDER, { recursive: true });
}

export async function getCaptchaText(imagePath) {
  return new Promise((resolve, reject) => {
    try {
      const tesseract = spawn(TESSERACT_PATH, [imagePath, "stdout", "--psm", "8"]);
      let output = "";

      tesseract.stdout.on("data", (data) => {
        output += data.toString();
      });

      tesseract.on("close", (code) => {
        if (code === 0) {
          const text = output.trim();
          console.log(`\n${"=" * 50}`);
          console.log(`CAPTCHA KODU: ${text}`);
          console.log(`${"=" * 50}\n`);
          resolve(text);
        } else {
          reject(new Error(`Tesseract process exited with code ${code}`));
        }
      });

      tesseract.on("error", (err) => {
        if (err.code === "ENOENT") {
          reject(new Error(`Tesseract OCR bulunamadı. Lütfen şu yolu kontrol edin: ${TESSERACT_PATH}`));
        } else {
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function saveBase64Image(base64Data, imagePath) {
  try {
    if (base64Data.includes(",")) {
      base64Data = base64Data.split(",")[1];
    }

    const imageBuffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(imagePath, imageBuffer);
    return true;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    return false;
  }
}

export async function checkSuccess(page) {
  try {
    if (page.url().includes("appointment-form")) {
      await sendMessage(getMessage("captcha_solved"));
      return true;
    }

    const errorPopup = await page.$(".swal2-content");
    if (errorPopup) {
      const errorText = await errorPopup.evaluate((el) => el.textContent);
      if (errorText.includes("Təsdiq kodu yanlışdır")) {
        await sendMessage(getMessage("captcha_failed"));
        const closeButton = await page.$(".swal2-confirm");
        if (closeButton) {
          await closeButton.click();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking success:", error);
    return false;
  }
}

export async function downloadCaptcha(page) {
  while (true) {
    try {
      const imageSrc = await page.evaluate(() => {
        const captcha = document.querySelector(".imageCaptcha");
        return captcha ? captcha.src : null;
      });

      if (!imageSrc) {
        console.log("CAPTCHA URL not found, refreshing page...");
        await page.reload();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const timestamp = Date.now();
      const imagePath = path.join(IMG_FOLDER, `captcha_${timestamp}.jpg`);

      if (imageSrc.startsWith("data:image")) {
        if (await saveBase64Image(imageSrc, imagePath)) {
          const captchaText = await getCaptchaText(imagePath);
          if (captchaText) {
            await page.type("#mailConfirmCodeControl", captchaText);
            const confirmButton = await page.$("#confirmationbtn");
            if (confirmButton) {
              await confirmButton.click();
              await new Promise((resolve) => setTimeout(resolve, 2000));

              if (await checkSuccess(page)) {
                return captchaText;
              }
            }
          }
        }
      } else {
        console.log("Regular URL handling not implemented yet");
      }

      await page.reload();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error in downloadCaptcha:", error);
      await page.reload();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
