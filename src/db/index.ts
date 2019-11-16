import mongoose from "mongoose";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

export const connect = async () => {
  await mongoose.connect("mongodb://localhost/test", options);
};

export const disconnect = async () => {
  await mongoose.disconnect();
};
