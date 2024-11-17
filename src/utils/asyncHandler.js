import { randomise } from "./index.js";

const asyncHandler = (fn) => async (ctx) => {
  try {
    await fn(ctx);
  } catch (err) {
    if (err.response) {
      ctx.reply(err.response.data.message);
    } else {
      console.error(err);
      ctx.reply(randomise([
        "💥 Oh no, looks like we blundered a piece! Try again or check your move.",
        "❗ Illegal move detected! Something went wrong, but we'll figure it out."
      ]));
    }
  }
};

export default asyncHandler;