import ChessImageGenerator from "https://raw.githubusercontent.com/Awesome-Tofu/deno-chess-image-generator/refs/heads/master/src/index.js";
// import { loadImage } from "https://raw.githubusercontent.com/Awesome-Tofu/deno-chess-image-generator/refs/heads/master/deps.ts";
import { createCanvas, Image } from "jsr:@gfx/canvas@0.5.6";
import { Chess } from "npm:chess.js";
import { Buffer } from "node:buffer";

const loadImage = async (param) => {
  try {
    if (param.startsWith("http")) {
      return await Image.load(param);
    }
  } catch (error) {
    return new Image(param);
  }
}

const extractMovesFromPgn = (pgn) => {
  // Remove any lines that start with PGN headers (lines starting with '[')
  const movesOnly = pgn.replace(/\[.*\]\s*/g, '').trim();

  return movesOnly;
}

const imageGenerator = new ChessImageGenerator.default({
  size: 720,
  padding: [10, 10, 10, 10],
  style: "merida",
});

const chess = new Chess();

export default async (pgn, blackName, whiteName, blackIcon, whiteIcon, cb = (process) => { }) => {
  if (!pgn || !blackName || !whiteName || !blackIcon || !whiteIcon) {
    throw new Error("Missing required parameters");
  }
  pgn = extractMovesFromPgn(pgn);

  try {
    chess.loadPgn(pgn);
    const moves = chess.history();
    const images = {};
    let partialPGN = "";

    for (let i = 0; i <= moves.length; i++) {
      chess.reset();
      partialPGN = "";
      for (let j = 0; j < i; j++) {
        const move = chess.move(moves[j]);
        partialPGN += `${move.san} `;
      }
      await imageGenerator.loadFEN(chess.fen());
      const chessImage = await imageGenerator.generateBuffer();

      const canvas = createCanvas(720, 1000); // Adjust height to fit player names
      const ctx = canvas.getContext("2d");

      // Fill the background with white
      ctx.fillStyle = "#262421";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the chess image
      // console.log(chessImage);

      const img = await loadImage(chessImage);
      ctx.drawImage(img, 0, canvas.height / 2 - img.height / 2); // Offset by 40 pixels to fit the top player name


      const blackPlayerIcon = await loadImage(blackIcon);
      const whitePlayerIcon = await loadImage(whiteIcon);

      const avatarSize = 100;

      ctx.drawImage(blackPlayerIcon, 20, 20, avatarSize, avatarSize);
      ctx.drawImage(
        whitePlayerIcon,
        20,
        (canvas.height - img.height) / 2 + img.height + 20,
        avatarSize,
        avatarSize
      );

      ctx.font = "30px Arial";
      ctx.fillStyle = "white";

      ctx.fillText(blackName, canvas.width / 4, 70);
      ctx.fillText(whiteName, canvas.width / 4, 940);

      console.log(`generated image ${i + 1}`);

      const caption = `<b>Moves:</b> ${partialPGN.trim()}`.trim();
      images[`move_${i + 1}`] = { buffer_img: Buffer.from(canvas.encode().buffer), caption };
      cb((i + 1).toString());
    }

    console.log(("generated images"));
    return images;

  } catch (error) {
    console.error(error);
  }
};
