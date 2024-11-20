import { Composer, InlineKeyboard, InputFile } from "grammy";
import Chess from "../api/chess.js";
import { User } from "../db.js";
import { randomise, asyncHandler, fenToImage, getWinDetails } from "../utils/index.js";
import config from "../../config.js";
import fs from 'fs';
import { runPgn } from "./pgn.js";

const composer = new Composer();

const chatID = {}


function extractMonthYear(url) {
    const regex = /\/games\/(\d{4})\/(\d{2})/; // Matches the year and month in the URL
    const match = url.match(regex);

    if (match) {
        const year = match[1]; // Extracted year
        const month = match[2]; // Extracted month (in numeric form)

        // Convert numeric month to name
        const monthName = new Date(year, parseInt(month) - 1).toLocaleString("default", { month: "long" });
        return { text: `${monthName} ${year}`, month, year }; // e.g., "May 2022"
    }

    return null; // If no match is found
}

composer.command("archives", asyncHandler(async (ctx) => {
    const user = await User.findOne({ userID: ctx.from.id.toString() })

    if (!user) {
        return ctx.reply(randomise([
            "🤔 What's your opening gambit? I need your username to make the first move!\n\nExample:\n<pre><code>/login eternaltofu</code></pre>",
            "📛 A chess player without a username? Impossible! Drop it like a pawn to \n<pre><code>/login yourUsername.</code></pre>"
        ]), { parse_mode: "HTML" });
    }

    chatID[ctx.message.from.id] = {};
    chatID[ctx.message.from.id].chatID = ctx.chat.id;

    return ctx.reply("See your archives below!", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "📂 View Archives",
                        switch_inline_query_current_chat: "archives",
                    },
                ],
            ]
        },
    })

}));

composer.inlineQuery(/^archives(?:\.(\d{2})\.(\d{4}))?/i, asyncHandler(async (ctx) => {
    const match = ctx.match; // regex match object
    const query = ctx.inlineQuery.query; // query string
    
    const user = await User.findOne({ userID: ctx.from.id.toString() })

    if (!user) {
        return ctx.answerInlineQuery([
            {
                type: "article",
                id: "0",
                title: "Login to view archives",
                description: "You need to login to view archives",
                input_message_content: {
                    message_text: randomise([
                        "🤔 What's your opening gambit? I need your username to make the first move!\n\nExample:\n<pre><code>/login eternaltofu</code></pre>",
                        "📛 A chess player without a username? Impossible! Drop it like a pawn to \n<pre><code>/login yourUsername.</code></pre>"
                    ]),
                    parse_mode: "HTML",
                },
            },
        ], { cache_time: 0 });
    }

    // Get archive details from month and year
    const month = match[1];
    const year = match[2];
    if (month && year) {
        const archive = await Chess.getGameArchive(user.gameUserName, year, month);
        let games = archive.games;
        games = games.filter(game => !game.url.includes("/game/daily"));
        games = games.sort((a, b) => b.end_time - a.end_time).slice(0, 50);
        const results = games.map((game) => {
            const gameDate = new Date(game.end_time * 1000).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });


            return {
                type: "article",
                id: game.url,
                title: `Game on ${gameDate}`,
                description: `View game between ${game.white.username} and ${game.black.username}`,
                input_message_content: {
                    message_text: `♟️ Here is your game on ${gameDate}, ${ctx.from.first_name}!\n\nTap the button below to view.`,
                },
                reply_markup: new InlineKeyboard().text("♟️ View Game", `pgn_${user.gameUserName}_${month}_${year}_${game.url.replace("https://www.chess.com/game/live/", "")}`),
            };
        });

        return ctx.answerInlineQuery(results, { cache_time: 0 });
    }

    // Get available archives
    let availableArchives = (await Chess.availableArchiveDates(user.gameUserName)).archives;
    availableArchives = availableArchives.sort((a, b) => b.localeCompare(a)); // Sort in reverse order

    const results = availableArchives.map((archive) => {
        const monthYear = extractMonthYear(archive);
        return {
            type: "article",
            id: archive,
            title: monthYear.text,
            description: `View your games played in ${monthYear.text}`,
            input_message_content: {
                message_text: `♟️ Here are your games for ${monthYear.text}, ${ctx.from.first_name}!\n\nTap the button below to view.`,
            },
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "♟️ View Games",
                            switch_inline_query_current_chat: `archives.${monthYear.month}.${monthYear.year}`,
                        },
                    ],
                ]
            },
        };
    }
    );

    return ctx.answerInlineQuery(
        results,
        { cache_time: 0 }
    );
}));

composer.callbackQuery(/^pgn_(\w+)_(\d{2})_(\d{4})_(\d+)$/i, asyncHandler(async (ctx) => {
    const match = ctx.match;
    const user = await User.findOne({ userID: ctx.from.id.toString() });
    if (!user) {
        return ctx.answerCallbackQuery("You need to login to view this game!", { show_alert: true });
    }

    // await ctx.api.deleteMessage(null, inlineMessageId);

    const gameUserName = match[1];
    const month = match[2];
    const year = match[3];
    const gameID = match[4];

    const games = await Chess.getGameArchive(gameUserName, year, month);
    const game = games.games.find(game => game.url.includes(gameID));


    const getWinDetail = getWinDetails(game.white.result, game.black.result);

    const gamePreviewImage = await fenToImage(game.fen,
        {
            name: game.black.username,
            icon: (await Chess.getProfile(game.black.username)).avatar || config.DEFAULT_ICON,
            score: getWinDetail.blackScore,
            elo: game.black.rating,
        },
        {
            name: game.white.username,
            icon: (await Chess.getProfile(game.white.username)).avatar || config.DEFAULT_ICON,
            score: getWinDetail.whiteScore,
            elo: game.white.rating,
        },
        {
            type: game.time_class,
            by: getWinDetail.by,
        }
    )

    fs.writeFileSync("tes.png", gamePreviewImage);

    const inlineKeyboard = new InlineKeyboard()
        .text("♟️ View Full Game", `run_pgn_${gameUserName}_${month}_${year}_${gameID}`);


    return ctx.api.sendPhoto(
        chatID[ctx.callbackQuery.from.id].chatID,
        new InputFile(gamePreviewImage),
        {
            caption: "Click the button below to view the full game.",
            reply_markup: inlineKeyboard
        }
    )
}));

composer.callbackQuery(/^run_pgn_(\w+)_(\d{2})_(\d{4})_(\d+)$/i, asyncHandler(async (ctx) => {
    const match = ctx.match;
    const gameUserName = match[1];
    const month = match[2];
    const year = match[3];
    const gameID = match[4];

    // Fetch game details
    const games = await Chess.getGameArchive(gameUserName, year, month);
    const game = games.games.find(game => game.url.includes(gameID));

    // Call runPgn with the necessary data
    await runPgn(
        game.pgn,                     // PGN string
        game.black.username,          // Black player name
        game.white.username,          // White player name
        (await Chess.getProfile(game.black.username)).avatar || config.DEFAULT_ICON,            // Black player avatar
        (await Chess.getProfile(game.white.username)).avatar || config.DEFAULT_ICON,            // White player avatar
        ctx,                          // Context (Telegram bot)
        { chat: { id: chatID[ctx.callbackQuery.from.id].chatID }, message_id: ctx.callbackQuery.message.message_id }
    );
}));


export default composer;