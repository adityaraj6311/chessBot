import { Bot, webhookCallback } from "grammy";
import Commands from "./src/index.js";
import config from "./config.js";
import express from "express";

const bot = new Bot(config.BOT_TOKEN);
await bot.init();
const botUsername = bot.botInfo.username;

bot.use(Commands);

bot.command("start", (ctx) => ctx.reply("Hello! I'm your bot!"));

bot.use(async (ctx, next) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const messageTime = ctx.message?.date;

  if (currentTime - messageTime > 60) {
    console.log("Ignoring old message", { from: ctx.from, chat: ctx.chat });
    return;
  }

  await next();
});

// Initialize Express for webhook handling
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for handling JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`${botUsername} is running!`);
})
// Set up the webhook endpoint
app.use("/webhook", webhookCallback(bot, "express"));

// Start the Express server
app.listen(PORT, async () => {
  console.log(`${botUsername} is ready and listening for webhooks!`);
});
