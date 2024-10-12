import { getDetails } from "./getDetails.js";

async function main() {
  console.log("starting program");
  const test = await getDetails("https://pump.fun/profile/_o_o_");
  console.log(test);
}

main();
