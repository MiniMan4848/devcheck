import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function getDetails(url) {
  const browser = await puppeteer.launch({ slowMo: 8 });
  const page = await browser.newPage();

  async function getData(selector) {
    return await page.evaluate((selector) => {
      return Array.from(document.querySelectorAll(selector)).map((x) =>
        x.textContent.trim()
      );
    }, selector);
  }

  var totalCreationCount = 0;
  var totalMigrationCount = 0;
  var allDates = [];
  var allCaps = [];
  var allNames = [];

  // Go to the page and wait until it's mostly idle
  await page.goto(url, { waitUntil: "networkidle2" });

  const name = await getData(
    ".align-end > div:nth-child(1) > div:nth-child(1)"
  );

  const wallet = await getData(".sm\\:text-sm");

  const followersRaw = await getData(
    ".align-end > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)"
  );
  const followers = followersRaw[0] ? followersRaw[0].replace(/\D/g, "") : "0";

  const likesRaw = await getData(".text-red-500");
  const likes = likesRaw[0] ? likesRaw[0].replace(/\D/g, "") : "0";

  await page.click(".inline-flex");
  await page.click("#btn-accept-all");

  // check current coin holdings worth more than 0.1 SOL
  await page.click(
    "div.flex-1:nth-child(2) > div:nth-child(1) > div:nth-child(1)"
  );
  await page.waitForSelector(".justify-items-right > div:nth-child(2)");
  await new Promise((resolve) => setTimeout(resolve, 45));

  // get SOL amount
  const tokenName = await getData(
    "div.min-w-\\[350px\\] > div:nth-child(2) > div:nth-child(1)"
  );
  const amountSol = await getData(
    "div.min-w-\\[350px\\] > div:nth-child(2) > div:nth-child(2)"
  );

  var validTokenNames = [];
  var tokensMoreThanPointOne = [];

  for (let i = 0; i < amountSol.length; i++) {
    // what a function parse float is lmfao
    const comparableValues = parseFloat(amountSol[i]);

    if (comparableValues >= 0.1) {
      tokensMoreThanPointOne.push(amountSol[i]);
      const tokenNameWithoutNumbers = tokenName[i].replace(/^\d+\s*/, "");
      validTokenNames.push(tokenNameWithoutNumbers);
    }
  }

  // count how many coins they've made
  await page.click("div.cursor-pointer:nth-child(2)");
  await page.waitForSelector(".max-w-\\[400px\\]");
  await new Promise((resolve) => setTimeout(resolve, 35));

  // get last 3 coins details
  for (let i = 1; i < 4; i++) {
    const name = await getData(
      `.max-w-\\[400px\\] > a:nth-child(${i}) > div:nth-child(1) > div:nth-child(2) > p:nth-child(4) > span:nth-child(1)`
    );
    allNames.push(...name);

    const dates = await getData(
      `.max-w-\\[400px\\] > a:nth-child(${i}) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > span:nth-child(2)`
    );
    allDates.push(...dates);

    var mcap = await getData(
      `.max-w-\\[400px\\] > a:nth-child(${i}) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)`
    );
    mcap = mcap.map((cap) => cap.replace("market cap: ", ""));
    allCaps.push(parseFloat(...mcap) + "K");
  }

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
      // refetch button class name, fixes profiles with many tokens
      var nextButtonClassName = await (
        await (
          await page.$("button.text-sm:nth-child(3)")
        ).getProperty("className")
      ).jsonValue();

      await page.click("button.text-sm:nth-child(3)");
      // wait for page to load
      await page.waitForSelector(".max-w-\\[400px\\]");
      var pageMigrationCount = await page.$$eval(
        'img[src*="/_next/image?url=%2Fmigrated.png&w=48&q=75"]',
        (images) => images.length
      );
      var pageCount = await page.$$eval(
        ".max-w-\\[400px\\] > a",
        (as) => as.length
      );
      totalCreationCount += pageCount;
      totalMigrationCount += pageMigrationCount;

      // if there are no a tags on the page, break the loop
      if (pageCount === 0) {
        break;
      }
    }
  } else {
    var pageMigrationCount = await page.$$eval(
      'img[src*="/_next/image?url=%2Fmigrated.png&w=48&q=75"]',
      (images) => images.length
    );
    var pageCount = await page.$$eval(
      ".max-w-\\[400px\\] > a",
      (as) => as.length
    );
    totalCreationCount += pageCount;
    totalMigrationCount += pageMigrationCount;
  }

  const migrationRate =
    ((totalMigrationCount / totalCreationCount) * 100).toFixed(2) + "%";

  await browser.close();

  return {
    name: name,
    wallet: wallet,
    followers: followers,
    likes: likes,
    tokensCreated: totalCreationCount,
    releventHoldingTokenNames: validTokenNames,
    relevantHoldingAmounts: tokensMoreThanPointOne,
    lastThreeNames: allNames,
    lastThreeDates: allDates,
    lastThreeCaps: allCaps,
    totalMigrated: totalMigrationCount,
    migrationRate: migrationRate,
  };
}
