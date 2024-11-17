import { MongoClient } from "npm:mongodb";
import config from "../config.js";

if (!config.MONGO_URI) {
  console.error("MONGO_URI is required in .env file");
  Deno.exit(1);
}

let client;
try {
  client = new MongoClient(config.MONGO_URI); // Use URI directly
  console.log("\nMONGODB CONNECTED 🌐");
} catch (error) {
  console.error("MONGODB CONNECTION FAILED:", error.message);
  Deno.exit(1);
}

const db = client.db(config.DB_NAME);

// User Model
const User = db.collection("users");

// Config Model
const Config = db.collection("config");

export { db, User, Config };
