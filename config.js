import "https://deno.land/std@0.204.0/dotenv/load.ts";

export default {
    BOT_TOKEN: Deno.env.get("BOT_TOKEN"),
    MONGO_URI: Deno.env.get("MONGO_URI"),
    DB_NAME: "chessBot",
    DEFAULT_ICON: "https://files.catbox.moe/djc10c.png"
}