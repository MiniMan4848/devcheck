import { getDetails } from "./getDetails.js";

async function main() {
  console.log("starting program");
  const test = await getDetails("https://pump.fun/profile/oduncu");
  console.log(test);
}

main();
