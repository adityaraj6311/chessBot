import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import ChessImageGenerator from "npm:chess-image-generator@1.0.9";
import { Chess } from "npm:chess.js";

const imageGenerator = new ChessImageGenerator({
  size: 720,
  padding: [10, 10, 10, 10],
  style: "merida",
});

const chess = new Chess();

export default async (pgn, blackName, whiteName, blackIcon, whiteIcon) => {
  chess.loadPgn(pgn);
  const moves = chess.history();
  const images = {};

  for (let i = 0; i <= moves.length; i++) {
    chess.reset();
    for (let j = 0; j < i; j++) {
      chess.move(moves[j]);
    }
    await imageGenerator.loadFEN(chess.fen());
    const chessImage = await imageGenerator.generateBuffer();

    const canvas = createCanvas(720, 1000); // Adjust height to fit player names
    const ctx = canvas.getContext("2d");

    // Fill the background with white
    ctx.fillStyle = "#262421";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the chess image
    const img = await loadImage(chessImage);
    ctx.drawImage(img, 0, canvas.height / 2 - img.height / 2); // Offset by 40 pixels to fit the top player name

    // Load player images
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

    images[`move_${i + 1}`] = canvas.toBuffer();
  }

  return images;
};
