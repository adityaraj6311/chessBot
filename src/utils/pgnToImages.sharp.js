

import sharp from "npm:sharp";
// import ChessImageGenerator from "npm:chess-image-generator";
import { Chess } from "npm:chess.js";
import fetch from "npm:node-fetch";
import axios from "npm:axios";
import { Buffer } from "npm:buffer"
import fs from "node:fs";

// const imageGenerator = new ChessImageGenerator({
//   size: 720,
//   padding: [10, 10, 10, 10],
//   style: "merida",
// });

function extractMovesFromPgn(pgn) {
  // Remove any lines that start with PGN headers (lines starting with '[')
  const movesOnly = pgn.replace(/\[.*\]\s*/g, '').trim();

  return movesOnly;
}

async function urlToBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function fenToBuffer(fen) {
  const res = await axios.get();
  return Buffer.from(res.data, "base64");
}

function createTextSVG(text, fontSize, width, height, color = "white") {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { font: ${fontSize}px Arial; fill: ${color}; dominant-baseline: middle; text-anchor: middle; }
      </style>
      <text x="50%" y="50%" class="text">${text}</text>
    </svg>
  `);
}

const chess = new Chess();

export default async (pgn, blackName, whiteName, blackIcon, whiteIcon) => {
  try {
    chess.loadPgn(extractMovesFromPgn(pgn));
  } catch (error) {
    console.log(error);

    return "INVALID_MOVE";
  }

  const moves = chess.history();
  const images = {};

  for (let i = 0; i <= moves.length; i++) {
    chess.reset();
    for (let j = 0; j < i; j++) {
      console.log(1);
      
      chess.move(moves[j]);
    }

    const chessImageBuffer = await urlToBuffer(`https://fen2image.chessvision.ai/${chess.fen()}?turn=black`);
    
    const image = sharp(chessImageBuffer)
    const metadata = await image.metadata()
    console.log(metadata.width, metadata.height)
    console.log(3);
    

    // const chessImageBuffer = await imageGenerator.generateBuffer();

    const blackAvatarBuffer = await sharp(await urlToBuffer(blackIcon)).resize(100, 100).toBuffer();
    const whiteAvatarBuffer = await sharp(await urlToBuffer(whiteIcon)).resize(100, 100).toBuffer();

    const blackNameSVG = createTextSVG(blackName, 30, 400, 50);
    const whiteNameSVG = createTextSVG(whiteName, 30, 400, 50);

    // Create a blank canvas
    const canvasBuffer = await sharp({
      create: {
        width: 720,
        height: 1000,
        channels: 4,
        background: "#262421",
      },
    })
      .composite([
        { input: chessImageBuffer, top: 140, left: 0 },
        { input: blackAvatarBuffer, top: 20, left: 20 },
        { input: whiteAvatarBuffer, top: 880, left: 20 },
        { input: blackNameSVG, top: 50, left: 150 },
        { input: whiteNameSVG, top: 920, left: 150 },
      ])
      .png()
      .toBuffer();

    // console.log(`move_${i + 1}`);
    images[`move_${i + 1}`] = canvasBuffer;
  }

  return images;
};
