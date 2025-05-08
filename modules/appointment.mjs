import { sendMessage } from "./telegram.mjs";
import { TIMING } from "../config/timing.js";
import { MESSAGES } from "../config/messages.js";

export async function fillAppointmentForm(page) {
  try {
    await new Promise((resolve) => setTimeout(resolve, TIMING.INITIAL_LOAD_DELAY));

    if (!page.url().includes("appointment-form")) {
      console.log(MESSAGES.REPORT.FORM_NOT_FOUND);
      await sendMessage(MESSAGES.REPORT.FORM_NOT_FOUND);
      return false;
    }

    const selections = [
      { selector: "#country", value: "1", message: "Müraciət növü: Schengen Visa" },
      { selector: "#visitingcountry", value: "1", message: "Səfər ölkəsi: Germany" },
      { selector: "#city", value: "7", message: "Şəhər: Baku" },
      { selector: "#office", value: "1", message: "Filial: Baku" },
      { selector: "#officetype", value: "1", message: "Xidmət növü: NORMAL" },
      { selector: "#totalPerson", value: "1", message: "Ərizəçi sayı: 1" },
    ];

    for (const { selector, value, message } of selections) {
      const element = await page.$(selector);
      if (element) {
        await element.select(value);
        console.log(`✅ ${message}`);
        await new Promise((resolve) => setTimeout(resolve, TIMING.FORM_FILL_DELAY));
      } else {
        const errorMessage = MESSAGES.REPORT.FORM_ELEMENT_NOT_FOUND.replace("{selector}", selector);
        console.log(errorMessage);
        await sendMessage(errorMessage);
        return false;
      }
    }

    return true;
  } catch (error) {
    const errorMessage = MESSAGES.REPORT.FORM_ERROR.replace("{error}", error.message);
    console.error(errorMessage);
    await sendMessage(errorMessage);
    return false;
  }
}

export async function checkAvailability(page) {
  try {
    // Get CSRF token
    const csrfToken = await page.evaluate(() => {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      return metaTag ? metaTag.getAttribute("content") : null;
    });

    if (!csrfToken) {
      throw new Error("CSRF token not found");
    }

    // Get cookies
    const cookies = await page.cookies();
    const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

    // Prepare request data
    const requestData = new URLSearchParams({
      serviceType: "1",
      totalPerson: "1",
      getOfficeID: "1",
      calendarType: "2",
      getConsular: "1",
    });

    // Send POST request
    const response = await page.evaluate(
      async (data) => {
        const res = await fetch("/az/getavailablefirstdate", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Csrf-Token": data.csrfToken,
            "X-Requested-With": "XMLHttpRequest",
          },
          body: data.requestData,
        });

        const responseData = await res.json();
        return {
          status: res.status,
          data: responseData,
        };
      },
      { csrfToken, requestData: requestData.toString() }
    );

    const availabilityMessage = MESSAGES.REPORT.AVAILABILITY_CHECK.replace("{status}", response.status).replace(
      "{isAvailable}",
      response.data.isAvailable
    );

    console.log(availabilityMessage);
    await sendMessage(availabilityMessage);

    return response.data;
  } catch (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
}

export async function monitorAvailability(page) {
  const sessionStartTime = Date.now();

  while (Date.now() - sessionStartTime < TIMING.SESSION_DURATION) {
    try {
      const response = await checkAvailability(page);

      if (response.isAvailable) {
        const message = MESSAGES.APPOINTMENT.AVAILABLE;
        console.log(message);
        await sendMessage(message, true);
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, TIMING.AVAILABILITY_CHECK_INTERVAL));
    } catch (error) {
      if (error.message.includes("status") && error.message !== "200") {
        // Session expired or other error, need to restart
        return false;
      }
      console.error("Error in availability check:", error);
      await new Promise((resolve) => setTimeout(resolve, TIMING.AVAILABILITY_CHECK_INTERVAL));
    }
  }

  return false;
}
