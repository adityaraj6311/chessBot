import ChessImageGenerator from "chess-image-generator";
import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { registerFont } from "canvas";
import { Chess } from "chess.js";
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
registerFont(path.join(__dirname, "assets", "Lexend-Bold.ttf"), { family: "Lexend", weight: "bold" });


const extractMovesFromPgn = (pgn) => {
  const movesOnly = pgn.replace(/\[.*\]\s*/g, '').trim();
  return movesOnly;
}

const imageGenerator = new ChessImageGenerator({
  size: 720,
  padding: [10, 10, 10, 10],
  style: "merida",
  dark: "#739552",
  light: "#EBECD0"
});

const chess = new Chess();

export default async (pgn, blackName, whiteName, blackIcon, whiteIcon, cb = (process) => { }) => {
  if (!pgn || !blackName || !whiteName || !blackIcon || !whiteIcon) {
    throw new Error("Missing required parameters");
  }
  console.log(pgn);
  
  // pgn = extractMovesFromPgn(pgn);

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

      ctx.font = "30px Lexend";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(blackName, canvas.width / 3, 70);
      ctx.fillText(whiteName, canvas.width / 3, 940);

      console.log(`generated image ${i + 1}`);

      const caption = `<b>Moves:</b> ${partialPGN.trim()}`.trim();
      images[`move_${i + 1}`] = { buffer_img: canvas.toBuffer("image/png"), caption };
      cb((i + 1).toString());
    }

    console.log(("generated images"));
    return images;

  } catch (error) {
    console.error(error);
  }
};



export const fenToImage = async (fen, black, white, game) => {
  try {
    const newChess = new Chess();
    newChess.load(fen);
    console.log(newChess.fen());
    await imageGenerator.loadFEN(newChess.fen());
    const chessImage = loadImage(await imageGenerator.generateBuffer());
    const canvas = createCanvas(720, 720);
    const ctx = canvas.getContext("2d");
    const img = await chessImage;
    ctx.drawImage(img, 0, 0);

    // Make a black squareand put in the middle of the image
    const squareSize = 240;
    const squareX = (canvas.width - squareSize) / 2;
    const squareY = (canvas.height - squareSize) / 2;
    const cornerRadius = 20;
    ctx.fillStyle = "#1E1D1A";
    ctx.beginPath();
    ctx.moveTo(squareX + cornerRadius, squareY);
    ctx.lineTo(squareX + squareSize - cornerRadius, squareY);
    ctx.quadraticCurveTo(squareX + squareSize, squareY, squareX + squareSize, squareY + cornerRadius);
    ctx.lineTo(squareX + squareSize, squareY + squareSize - cornerRadius);
    ctx.quadraticCurveTo(squareX + squareSize, squareY + squareSize, squareX + squareSize - cornerRadius, squareY + squareSize);
    ctx.lineTo(squareX + cornerRadius, squareY + squareSize);
    ctx.quadraticCurveTo(squareX, squareY + squareSize, squareX, squareY + squareSize - cornerRadius);
    ctx.lineTo(squareX, squareY + cornerRadius);
    ctx.quadraticCurveTo(squareX, squareY, squareX + cornerRadius, squareY);
    ctx.closePath();
    ctx.fill();

    const whoWon = black.score === 1 ? "Black Won" : white.score === 1 ? "White Won" : "Draw";
    ctx.font = "25px Lexend";
    ctx.fillStyle = "white";
    ctx.fillText(whoWon, (canvas.width / 2) + (whoWon === "Draw" ? -40 : -70), (canvas.height / 2) - 80);

    ctx.font = "17px Arial";
    ctx.fillStyle = "#C5C4C4";
    ctx.fillText(game.by, (canvas.width / 2) - 60, (canvas.height / 2) - 55);

    const whitePlayerIcon = await loadImage(white.icon);
    const blackPlayerIcon = await loadImage(black.icon);

    const avatarSize = 70;
    // Draw white player icon with white border
    const whitePlayerX = (canvas.width - whitePlayerIcon.width) / 2;
    const whitePlayerY = ((canvas.height - whitePlayerIcon.height) / 2) + 60;
    ctx.drawImage(whitePlayerIcon, whitePlayerX, whitePlayerY, avatarSize, avatarSize);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.strokeRect(whitePlayerX, whitePlayerY, avatarSize, avatarSize);

    const blackPlayerX = ((canvas.width - blackPlayerIcon.width) / 2) + 130;
    const blackPlayerY = ((canvas.height - blackPlayerIcon.height) / 2) + 60;
    ctx.drawImage(blackPlayerIcon, blackPlayerX, blackPlayerY, avatarSize, avatarSize);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.strokeRect(blackPlayerX, blackPlayerY, avatarSize, avatarSize);

    const gameType = `https://www.chess.com/bundles/web/images/color-icons/${game.type}.svg`;
    const gameIcon = await loadImage(gameType);
    ctx.drawImage(gameIcon, ((canvas.width - gameIcon.width) / 2) + 24, ((canvas.height - gameIcon.height) / 2) + 20, 40, 40);

    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(white.name, (canvas.width / 2) - 110, (canvas.height / 2) + 60);
    ctx.fillText(black.name, (canvas.width / 2) + 30, (canvas.height / 2) + 60);

    // Add elo
    ctx.fillText(`Elo: ${white.elo.toString()}`, (canvas.width / 2) - 110, (canvas.height / 2) + 85);
    ctx.fillText(`Elo: ${black.elo.toString()}`, (canvas.width / 2) + 30, (canvas.height / 2) + 85);
    return canvas.toBuffer("image/png");
  } catch (error) {
    error.response = {};
    error.response.data = {};

    console.log(error);

    error.response.data.message = "Invalid FEN";
  }
}

export const getWinDetails = (whiteResult, blackResult) => {
  if (whiteResult === "agreed" && blackResult === "agreed") {
      return {
          by: "by agreement",
          whiteScore: 3,
          blackScore: 3
      }
  } else if (whiteResult === "resigned" || blackResult === "resigned") {
      return {
          by: "by resignation",
          whiteScore: blackResult === "resigned" ? 1 : 0,
          blackScore: whiteResult === "resigned" ? 1 : 0
      }
  } else if (whiteResult === "timeout" || blackResult === "timeout") {
      return {
          by: "by timeout",
          whiteScore: blackResult === "timeout" ? 1 : 0,
          blackScore: whiteResult === "timeout" ? 1 : 0
      }
  } else if (whiteResult === "checkmated" || blackResult === "checkmated") {
      return {
          by: "by checkmate",
          whiteScore: blackResult === "checkmated" ? 1 : 0,
          blackScore: whiteResult === "checkmated" ? 1 : 0
      }
  } else if (whiteResult === "abandoned" || blackResult == "abandoned") {
      return {
          by: "by abandonment",
          whiteScore: blackResult === "abandoned" ? 1 : 0,
          blackScore: whiteResult === "abandoned" ? 1 : 0
      }
  }
  else {
      console.log("Something is wrong with the result");
  }
}
