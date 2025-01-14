import { Composer } from "npm:grammy";
import { User } from "../db.js";
import { asyncHandler, randomise } from "../utils/index.js";
import config from "../../config.js"
import Chess from "../api/chess.js";

const composer = new Composer();

const getReplyMsg = async (userDetail) => {
    const avatar = userDetail.userDetail.avatar || config.DEFAULT_ICON;
    const bio = await Chess.getBio(userDetail.userDetail.username);

    const preMessage = `${randomise([
        "🏆 Profile found! Looks like you’ve been playing a queen’s gambit all along.",
        "♕ Your profile is here, ready to dominate the board. Here's your chess journey so far"
    ])}: <a href="${avatar}">‎</a>`;

    const message = `
<b>Username</b>: ${userDetail.userDetail.username}
${userDetail.userDetail.name ? `<b>Name</b>: ${userDetail.userDetail.name}` : ""}
<b>Player ID</b>: ${userDetail.userDetail.player_id}
${userDetail.userDetail.title ? `<b>Title</b>: ${userDetail.userDetail.title}` : ""}
${userDetail.userDetail.status ? `<b>Status</b>: ${userDetail.userDetail.status}` : ""}
${bio ? `<b>Bio</b>: ${bio}` : ""}
<b>Joined</b>: ${new Date(userDetail.userDetail.joined * 1000).toDateString()}
<b>Country</b>: ${await Chess.getFlagEmoji(userDetail.userDetail.country)}
<b>Last seen</b>: ${userDetail.cbUserDetail.lastLoginDate}
<b>Online Status</b>: ${userDetail.cbUserDetail.onlineStatus}
<b>${userDetail.cbUserDetail.bestRatingType}</b>: ${userDetail.cbUserDetail.bestRating.toString()}
<b>Friends</b>: ${userDetail.userDetail.followers}
<b>is Streamer ?</b>: ${userDetail.userDetail.is_streamer ? "Yes" : "No"}
    `.trim();

    return preMessage + '\n\n' + message
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n')
        .trim();
}

composer.command("myinfo", asyncHandler(async (ctx) => {

    const fetching = await ctx.reply(randomise([
        "🔍 Scanning the board for your profile...\nHold tight, your data is moving faster than a knight!",
        "♟️ Just a moment... analyzing your chess DNA to fetch your profile!"
    ]));

    const user = await User.findOne({ userID: ctx.from.id.toString() });

    if (!user) {
        return await ctx.editMessageText(randomise([
            "🚫 Hmm, it seems you're not logged in! The chessboard is empty. Please use /login to enter the game.",
            "🙅‍♂️ You can't access your profile without a login move. Go ahead and use /login to get started!"
        ]), { message_id: fetching.message_id });
    }

    const userDetail = await Chess.getProfile(user.gameUserName);
    const cbUserDetail = await Chess.getCallbackProfile(user.gameUserName);

    const replyMsg = await getReplyMsg({ userDetail, cbUserDetail });

    await ctx.editMessageText(replyMsg, {
        parse_mode: "HTML",
        disable_web_page_preview: false,
        message_id: fetching.message_id,
    });
}))

composer.command("inspect", asyncHandler(async (ctx) => {

    // First, check if the user provided a game username in the command. 
    // If not, check if they replied to someone (a valid chess user) to inspect.
    let gameUserName = ctx.message.text.split(" ")[1];

    if (!gameUserName) {
        // If no username is provided and it's not a reply to another user, ask for a username
        if (ctx.message.reply_to_message) {
            const user = await User.findOne({ userID: ctx.message.reply_to_message.from.id.toString() });
            if (!user) {
                return await ctx.reply(randomise([
                    "🙅‍♂️ *Oops, the player you're inspecting isn't logged in! Maybe they’re off the board for now.*",
                    "🚫 *It looks like the user hasn’t made their move yet. They’re not logged in!*",
                    "🤷‍♂️ *The user you replied to is not logged in. They might be in another game right now!*"
                ]), { parse_mode: "Markdown" });
            }

            gameUserName = user.gameUserName;
        } else {
            // If neither is true, prompt the user to provide a username or reply to someone
            return await ctx.reply(randomise([
                "🤔 *What's your opening gambit? I need a username to make the first move!*\n\nExample:\n<pre><code>/inspect eternaltofu</code></pre>\nor reply to someone",
                "📛 *A chess player without a username? Impossible! Drop it like a pawn and use \n<pre><code>/inspect eternaltofu.</code></pre>\nor reply to someone"
            ]), { parse_mode: "HTML" });
        }
    }

    // Display a message that the bot is fetching the profile with a chess-related flair
    const fetching = await ctx.reply(randomise([
        "🔍 *Scanning the board for the profile...*\n*Hold tight, the data is moving faster than a knight!*",
        "♟️ *Just a moment... analyzing the chess DNA to fetch the profile!*"
    ]), { parse_mode: "Markdown" });

    // Fetch the profile details using the game username
    const userDetail = await Chess.getProfile(gameUserName);
    const cbUserDetail = await Chess.getCallbackProfile(gameUserName);

    // Prepare a detailed reply message about the user's chess profile
    const replyMsg = await getReplyMsg({ userDetail, cbUserDetail });

    // Update the message with the fetched profile information
    await ctx.editMessageText(replyMsg, {
        parse_mode: "HTML",
        disable_web_page_preview: false,
        message_id: fetching.message_id,
    });

}))


export default composer;