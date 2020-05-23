import mongoose from "mongoose";

// Does not save, just copies its data
export const duplicateDocument = <D extends mongoose.Document>(doc: D): D => {
  // Delete id
  const obj = doc.toObject();
  delete obj["_id"];
  delete obj["id"];
  return obj;
};
