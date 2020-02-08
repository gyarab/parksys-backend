import mongoose from "mongoose";
import config from "../config";
import * as mem from "./inMemory";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
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

const memConnect = async () => {
  await mem.connect(options);
};

const memDisconnect = async () => {
  await mem.softCloseDatabase();
};

let connect: () => Promise<any>;
let disconnect: () => Promise<any>;

if (process.env.NODE_ENV === "test") {
  connect = memConnect;
  disconnect = memDisconnect;
} else {
  connect = normalConnect;
  disconnect = normalDisconnect;
}

export { connect, disconnect, clear };
