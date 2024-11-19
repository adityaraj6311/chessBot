import { Composer } from 'npm:grammy';
const composer = new Composer();

import evaluate from "./commands/eval.js";
import auth from "./commands/auth.js";
import info from "./commands/info.js";
import pgn from "./commands/pgn.js";

composer.use(evaluate, auth, info, pgn);

export default composer;