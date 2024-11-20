import { Composer } from "grammy";
import { exec } from 'child_process'
import { autoQuote } from "@roziscoding/grammy-autoquote";

// Replace with your bot token
const composer = new Composer();

composer.use(autoQuote());

// Replace with your developer's Telegram ID
const DEV_ID = [5102929777, 5015417782, 5696053228, 7019511932];

composer.command("sh", async (ctx) => {
  if (!DEV_ID.includes(ctx.from.id)) {
    return ctx.reply("Unauthorized user");
  }

  const botInfo = await ctx.api.getMe();
  const input = ctx.message.text
    .replace(`@${botInfo.username}`, "")
    .replace(/^\/\w+\s?/, "")
    .trim();
  if (!input) {
    return ctx.reply("No Input Found!");
  }

  exec(input, (error, stdout, stderr) => {
    if (error) {
      return ctx.reply(`Error: ${error.message}`);
    }
    if (stderr) {
      return ctx.reply(`Stderr: ${stderr}`);
    }
    ctx.reply(
      `📎 Input: \`\`\`sh ${input}\`\`\`\n\n📒 Output:\n\`${stdout}\``,
      {
        parse_mode: "MarkdownV2",
      }
    );
  });
});

composer.command(["eval", "e"], async (ctx) => {
  if (!DEV_ID.includes(ctx.from.id)) {
    return ctx.reply("Unauthorized user");
  }

  const botInfo = await ctx.api.getMe();
  let preCode = ctx.message.text
    .replace(`@${botInfo.username}`, "")
    .replace(/^\/\w+\s?/, "")
    .trim();
  if (!preCode) {
    return ctx.reply("No code found!");
  }

  const code = `
  (async () => {
    const axios = require("axios");
    ${preCode}
  })();`;

  // Capture console.log output
  let logOutput = "";
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    logOutput += args.join(" ") + "\n";
    originalConsoleLog(...args);
  };

  try {
    const start = Date.now();
    let result = eval(code); // Be cautious with eval()
    const end = Date.now();

    if (result instanceof Promise) {
      result = await result;
    }

    console.log = originalConsoleLog;

    const output = `<b>📎 Input</b>: <pre><code class="language-javascript">${preCode}</code></pre>\n\n<b>📒 Output</b>:\n<code>${logOutput?.trim()}</code>\n\n<b>✨ Taken Time</b>: ${
      end - start
    }ms`;
    ctx.reply(output, { parse_mode: "HTML" });
  } catch (error) {
    console.log = originalConsoleLog;
    ctx.reply(`Error: ${error}`);
  }
});

composer.command(["adddev", "getdev"], async (ctx) => {
  if (!DEV_ID.includes(ctx.from.id)) {
    return ctx.reply("Unauthorized user");
  }
  const command = ctx.message.text.split(" ")[0].replace("/", "");

  if (command === "getdev") {
    let devList = "";
    DEV_ID.forEach((id) => {
      devList += `<a href="tg://user?id=${id}">${id}</a>\n`;
    });

    return ctx.reply(`List of developers:\n${devList}`, {
      parse_mode: "HTML",
    });
  }

  const user = ctx.message.reply_to_message?.from;
  if (!user) {
    return ctx.reply("Reply to a user to add as developer");
  }

  if (DEV_ID.includes(user.id)) {
    return ctx.reply("User is already a developer");
  } else {
    DEV_ID.push(user.id);
    return ctx.reply(
      `User <a href="tg://user?id=${user.id}">${user.first_name}</a> added as developer`,
      { parse_mode: "HTML" }
    );
  }
});


export default composer;