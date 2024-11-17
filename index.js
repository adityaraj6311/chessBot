import { Bot } from "npm:grammy";
import Commands from "./src/index.js"
import config from "./config.js";

const bot = new Bot(config.BOT_TOKEN);

bot.use(Commands);

bot.command("start", (ctx) => ctx.reply("Hello! I'm your bot!"));

bot.use(async (ctx, next) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const messageTime = ctx.message?.date;

  if (currentTime - messageTime > 60) {
    logger.info({ from: ctx.from, chat: ctx.chat }, "Ignoring old message");
    return;
  }

  await next();
});


const main = () => {
  bot.start()
  console.log("Bot is running!");
}

main();
// deno run --allow-net --allow-env --allow-read --allow-sys index.js  