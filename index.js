import { getDetails } from "./getDetails.js";

async function main() {
  console.log("starting program");
  const test = await getDetails(
    "https://pump.fun/profile/7FxKp63r8xDPowsk5Xcpw6Sa9ygPQQVwnkEX7Zgc2D6q"
  );
  console.log(test);
}

main();
