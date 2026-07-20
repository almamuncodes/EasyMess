import { MongoClient } from "mongodb";
import dns from "node:dns/promises";

try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {}

const uri = process.env.PUBLIC_MONGO_URI || "mongodb://localhost:27017/easymessUser";

let client;
let db;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
    global._mongoClientPromise = global._mongoClient.connect();
  }
  client = global._mongoClient;
  db = client.db("easymessUser");
} else {
  client = new MongoClient(uri);
  db = client.db("easymessUser");
}

export { client, db };
export async function getDb() {
  if (process.env.NODE_ENV === "development") {
    await global._mongoClientPromise;
  } else {
    await client.connect();
  }
  return db;
}
