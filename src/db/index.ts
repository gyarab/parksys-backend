import mongoose from "mongoose";
import * as mem from "./inMemory";
import config from "../config";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const clear = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

const normalConnect = async () => {
  console.log("Connecting to MongoDB");
  const { host, port, db } = config.get("mongo");
  await mongoose.connect(`mongodb://${host}:${port}/${db}`, options);
};

const normalDisconnect = async () => {
  await mongoose.disconnect();
};

let connect: () => Promise<any>;
let disconnect: () => Promise<any>;

if (process.env.NODE_ENV === "test") {
  connect = async () => await mem.connect(options);
  disconnect = mem.closeDatabase;
} else {
  connect = normalConnect;
  disconnect = normalDisconnect;
}

export { connect, disconnect, clear };
