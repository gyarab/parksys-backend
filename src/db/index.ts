import mongoose from "mongoose";
import * as mem from "./inMemory";

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
  await mongoose.connect("mongodb://localhost/test", options);
};

const normalDisconnect = async () => {
  await mongoose.disconnect();
};

let connect, disconnect;

if (process.env.NODE_ENV === "test") {
  connect = async () => await mem.connect(options);
  disconnect = mem.closeDatabase;
} else {
  connect = normalConnect;
  disconnect = normalDisconnect;
}

export { connect, disconnect, clear };
