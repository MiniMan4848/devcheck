import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

async function getData(selector) {
  return await page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector)).map((x) =>
      x.textContent.trim()
    );
  }, selector);
}

export async function getDetails(url) {
  // Go to the page and wait until it's mostly idle
  await page.goto(url, { waitUntil: "networkidle2" });

  const name = await getData(
    ".align-end > div:nth-child(1) > div:nth-child(1)"
  );

  const wallet = await getData(".sm\\:text-sm");

  await browser.close();

  return {
    name: name,
    wallet: wallet,
  };
}
