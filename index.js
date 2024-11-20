import { Bot } from "grammy";
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


const run = async () => {
  bot.start()
  await bot.init();
  const botUsername = bot.botInfo.username;
  console.log(`${botUsername} is running!`);
}

run();

// export default webhookCallback(bot, "std/http");