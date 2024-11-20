import { Composer } from "grammy";
import { User } from "../db.js";
import { asyncHandler, randomise } from "../utils/index.js";
import Chess from "../api/chess.js";
import config from "../../config.js";

const composer = new Composer();

composer.command(
  "login",
  asyncHandler(async (ctx) => {
    const logging = await ctx.reply("⏳ Strategizing your next move... Logging you in!");
    // Your login logic here
    const gameUserName = ctx.message.text.split(" ")[1];

    if (await User.findOne({ userID: ctx.from.id.toString() })) {
      return await ctx.editMessageText(
        randomise([
          "🛑 Oops, you're already in the game. No need to promote yourself twice!",
          "♟️ Hey, you've already castled in! No double moves allowed!"
        ]), { message_id: logging.message_id }
      );
    }

    if (!gameUserName) {
      return await ctx.editMessageText(
        randomise([
          "🤔 What's your opening gambit? I need your username to make the first move!\n\nExample:\n<pre><code>/login eternaltofu</code></pre>",
          "📛 A chess player without a username? Impossible! Drop it like a pawn to \n<pre><code>/login yourUsername.</code></pre>"
        ]), { message_id: logging.message_id, parse_mode: "HTML" }
      );
    }

    const userDetail = await Chess.getProfile(gameUserName);
    const avatar = userDetail.avatar || config.DEFAULT_ICON;

    const user = {
      userID: ctx.from.id.toString(),
      userName: ctx.from.username,
      name: ctx.from.first_name,
      gameUserName: gameUserName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await User.insertOne(user);
    await ctx.editMessageText(`${randomise([
      "✔️ Checkmate! You've successfully logged in!",
      `🏆 Welcome to the grandmaster's circle, ${gameUserName}! Your avatar is ready to take the board.`
    ])} [‎ ](${avatar})`, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
      message_id: logging.message_id,
    });
  })
);

composer.command("logout", asyncHandler(async (ctx) => {
  // Your logout logic here
  const user = await User.findOne({ userID: ctx.from.id.toString() });
  if (!user) {
    return await ctx.reply(randomise([
      "😅 Are you trying to resign from a game you never started? You aren't logged in!",
      "🚫 No need to rage quit; you're not even logged in yet."
    ]));
  }
  await User.deleteOne({ userID: ctx.from.id.toString() });
  await ctx.reply(randomise([
    "👋 You’ve left the board gracefully. See you next round!",
    "♘ Your knight has ridden off into the sunset. Logout successful!"
  ]));

}));

export default composer;