import { Composer, InlineKeyboard, InputFile } from "grammy";
import { pgnToImages, asyncHandler, loader } from "../utils/index.js";

const composer = new Composer();

const pgnImages = {};

export const runPgn = async (pgn, blackName, whiteName, blackIcon, whiteIcon, ctx, generating, text = "♟️") => {

    pgnImages[ctx.message.from.id] = await pgnToImages(pgn, blackName, whiteName, blackIcon, whiteIcon, (process) => {
        ctx.api.editMessageCaption(generating.chat.id,
            generating.message_id,
            {
                caption: `<pre>${text}</pre>\nGenerated ${process} image(s)...`,
                parse_mode: "HTML"
            }
        );
    });

    const imagesObject = pgnImages[ctx.message.from.id];
    if (imagesObject === "INVALID_MOVE") {
        return await ctx.api.editMessageMedia(
            generating.chat.id,
            generating.message_id,
            {
                type: "animation",
                media: "https://media1.tenor.com/m/aBHJfoPaxrQAAAAd/reaction-stupid.gif",
                caption: "Invalid move or PGN string.",
            }
        );
    }

    const moves = Object.keys(imagesObject); // Extract move keys (e.g., "move_1", "move_2")

    if (moves.length === 0) {
        return ctx.api.editMessageText(generating.chat.id, generating.message_id, "No valid moves generated.");
    }

    // Function to create navigation buttons
    const createKeyboard = (currentIndex) => {
        return new InlineKeyboard()
            .text("<<", `jump_0`) // Jump to first move
            .text("<", `jump_${currentIndex - 1}`) // Previous move
            .text(">", `jump_${currentIndex + 1}`) // Next move
            .text(">>", `jump_${moves.length - 1}`); // Jump to last move
    };

    // Send the first move's image with navigation buttons
    await ctx.api.editMessageMedia(
        generating.chat.id,
        generating.message_id,
        {
            type: "photo",
            media: new InputFile(imagesObject[moves[0]].buffer_img),
            caption: imagesObject[moves[0]].caption,
            parse_mode: "HTML"
        },
        {
            reply_markup: createKeyboard(0),
        }
    );

    // Handle navigation buttons
    composer.callbackQuery(/jump_(\d+)/, async (callbackCtx) => {
        try {
            const requestedIndex = parseInt(callbackCtx.match[1], 10);

            if (requestedIndex < 0 || requestedIndex >= moves.length) {
                await callbackCtx.answerCallbackQuery("Invalid move");
                return;
            }

            const moveKey = moves[requestedIndex];
            const media = new InputFile(imagesObject[moveKey].buffer_img)

            await callbackCtx.editMessageMedia(
                {
                    type: "photo",
                    media: media,
                    caption: imagesObject[moveKey].caption,
                    parse_mode: "HTML"
                },
                {
                    reply_markup: createKeyboard(requestedIndex),
                }
            );
            await callbackCtx.answerCallbackQuery(); // Acknowledge the callback
        } catch (error) {
            console.log(error.message);
        }
    });
}

composer.command("pgn", asyncHandler(async (ctx) => {
    const pgn = ctx.message.text.split(" ").slice(1).join(" ") || ctx.message.reply_to_message.text;
    if (!pgn) {
        return ctx.reply("Please provide a PGN string or reply to pgn message.\n<pre>/pgn [PGN]</pre>", { parse_mode: "HTML" });
    }
    // reply with a loading gif
    const { gif, text } = loader();
    const generating = await ctx.replyWithAnimation(
        gif,
        { caption: `<pre>${text}</pre>\n\nGenerating...\nThis might take time`, parse_mode: "HTML" }
    );

    const blackName = "Black";
    const whiteName = "White";
    const blackIcon = "https://files.catbox.moe/cpqooz.png";
    const whiteIcon = "https://files.catbox.moe/wp0uqq.png";
    await runPgn(pgn, blackName, whiteName, blackIcon, whiteIcon, ctx, generating, text);
}));

export default composer;