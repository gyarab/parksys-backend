import mongoose from "mongoose";

export interface ICheck extends mongoose.Document {
  time: Date;
  image: string;
}
export const CheckLabel = "Check";
export const CheckSchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      required: true,
      default: () => new Date() // Now
    },
    image: {
      type: String
    }
  },
  { _id: false, id: false }
);
export const Check = mongoose.model<ICheck>(CheckLabel, CheckSchema);
