import { sendMessage, getMessage } from "./telegram.mjs";

export async function fillAppointmentForm(page) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!page.url().includes("appointment-form")) {
      const message = getMessage("form_not_found");
      console.log(message);
      await sendMessage(message);
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
        await sendMessage(`✅ ${message}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        const errorMessage = getMessage("form_element_not_found", { selector });
        console.log(errorMessage);
        await sendMessage(errorMessage);
        return false;
      }
    }

    const successMessage = getMessage("form_filled");
    console.log(successMessage);
    await sendMessage(successMessage);
    return true;
  } catch (error) {
    const errorMessage = getMessage("form_error", { error: error.message });
    console.error(errorMessage);
    await sendMessage(errorMessage);
    return false;
  }
}
