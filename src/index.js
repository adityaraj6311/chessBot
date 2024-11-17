import { Composer } from 'npm:grammy';
const composer = new Composer();

import evaluate from "./commands/eval.js";
import auth from "./commands/auth.js";
import info from "./commands/info.js";

composer.use(evaluate, auth, info);

export default composer;