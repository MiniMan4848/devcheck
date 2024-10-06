import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({ headless: false, slowMo: 10 });
const page = await browser.newPage();

export async function getDetails(url) {
  var totalCreationCount = 0;

  // Go to the page and wait until it's mostly idle
  await page.goto(url, { waitUntil: "networkidle2" });

  const name = await getData(
    ".align-end > div:nth-child(1) > div:nth-child(1)"
  );
  const wallet = await getData(".sm\\:text-sm");
  const followers = await getData(
    ".align-end > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)"
  );
  const likes = await getData(".text-red-500");

  await page.click(".inline-flex");
  await page.click("#btn-accept-all");
  await page.click("div.cursor-pointer:nth-child(2)");
  await page.waitForSelector(".max-w-\\[400px\\]");

  // Fetch the initial class name of the button
  var nextButtonClassName = await (
    await (await page.$("button.text-sm:nth-child(3)")).getProperty("className")
  ).jsonValue();

  // Loop while the button is enabled
  if (
    nextButtonClassName ===
    "text-sm text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50"
  ) {
    while (
      nextButtonClassName ===
      "text-sm text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50"
    ) {
      await page.click("button.text-sm:nth-child(3)");
      // wait for page to load
      await page.waitForSelector(".max-w-\\[400px\\]");
      var pageCount = await page.$$eval(
        ".max-w-\\[400px\\] > a",
        (as) => as.length
      );
      totalCreationCount += pageCount;
      console.log("Page count: " + pageCount);
      console.log("totalCreationCount: " + totalCreationCount);

      // if there are no a tags on the page, break the loop
      if (pageCount === 0) {
        break;
      }
    }
  } else {
    var pageCount = await page.$$eval(
      ".max-w-\\[400px\\] > a",
      (as) => as.length
    );
    totalCreationCount += pageCount;
  }

  console.log("totalCreationCount: " + totalCreationCount);
  console.log("pageCount: " + pageCount);

  await browser.close();

  return {
    name: name,
    wallet: wallet,
    followers: followers,
    likes: likes,
    tokensCreated: totalCreationCount,
  };
}

async function getData(selector) {
  return await page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector)).map((x) =>
      x.textContent.trim()
    );
  }, selector);
}

/*
count how many released: 

click div.cursor-pointer:nth-child(2)
go to .max-w-\[400px\]
count how many a tags underneath it
click button.text-sm:nth-child(3)
wait for the page to load
count again
keep going until the button class name changes
*/
