import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  Client,
  IntentsBitField,
  ApplicationCommandOptionType,
  REST,
  Routes,
  EmbedBuilder,
} from "discord.js";
import dotenv from "dotenv";
import { getDetails } from "./getDetails.js";

dotenv.config();
puppeteer.use(StealthPlugin());

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildWebhooks,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const commands = [
  {
    name: "check",
    description:
      "investigate the dev of a pumpfun token (the more tokens made, the longer a response will take)",
    options: [
      {
        name: "ca",
        description: "you'll get the dev of this tokens track record",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("registering commands");

    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("commands registered");
  } catch (error) {
    console.error(`error: ${error}`);
  }
})();

client.on("ready", (c) => {
  console.log(`${c.user.tag} is online`);
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const CA = interaction.options.get("ca").value;

  interaction.deferReply();

  const webScrape = async () => {
    const browser = await puppeteer.launch({ slowMo: 1 });
    const page = await browser.newPage();

    await page.goto(`https://pump.fun/${CA}`, { waitUntil: "networkidle2" });

    await page.click(".inline-flex");
    await page.click("#btn-accept-all");
    await page.click(
      "div.inline-flex > a:nth-child(2) > span:nth-child(1) > span:nth-child(2)"
    );

    await page.waitForSelector(".justify-items-right > div:nth-child(2)");

    const checkURL = await page.url();
    await browser.close();
    const output = await getDetails(checkURL);
    const w = "`";

    if (output.releventHoldingTokenNames.length > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x360059)
        .setFooter({ text: "By MiniMan" })
        .addFields({
          name: "-- Developer Info -- ",
          value: `**Name: ** ${output.name}
    **Wallet: ** [${output.wallet}](https://solscan.io/account/${output.wallet})
    **Followers: ** ${w}${output.followers}${w}
    **Likes: ** ${w}${output.likes}${w} \n
    **Token holdings more than 0.1SOL: ** ${w}${output.releventHoldingTokenNames}${w}
    **Their amounts: ** ${w}${output.relevantHoldingAmounts}${w}\n
    **-- Last 3 tokens --**
    **Names: ** ${w}${output.lastThreeNames}${w}
    **Dates: ** ${w}${output.lastThreeDates}${w}
    **Market caps: ** ${w}${output.lastThreeCaps}${w}\n
    **-- Stats --**
    **Tokens Created: ** ${w}${output.tokensCreated}${w}
    **Total Migrated Tokens: ** ${w}${output.totalMigrated}${w}
    **Migration Rate: ** ${w}${output.migrationRate}${w}`,
          inline: false,
        });

      interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0x360059)
        .setFooter({ text: "By MiniMan" })
        .addFields({
          name: "-- Developer Info -- ",
          value: `**Name: ** ${output.name}
  **Wallet: ** [${output.wallet}](https://solscan.io/account/${output.wallet})
  **Followers: ** ${w}${output.followers}${w}
  **Likes: ** ${w}${output.likes}${w} \n
  **-- Last 3 tokens --**
  **Names: ** ${w}${output.lastThreeNames}${w}
  **Dates: ** ${w}${output.lastThreeDates}${w}
  **Market caps: ** ${w}${output.lastThreeCaps}${w}\n
  **-- Stats --**
  **Tokens Created: ** ${w}${output.tokensCreated}${w}
  **Total Migrated Tokens: ** ${w}${output.totalMigrated}${w}
  **Migration Rate: ** ${w}${output.migrationRate}${w}`,
          inline: false,
        });

      interaction.editReply({ embeds: [embed] });
    }
  };

  webScrape();
});

client.login(process.env.TOKEN);
