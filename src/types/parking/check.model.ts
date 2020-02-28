import mongoose from "mongoose";
import { DeviceLabel } from "../device/device.model";
import { CaptureImageLabel } from "../captureImage/captureImage.model";

export interface ICheck extends mongoose.Document {
  time: Date;
  images: string[];
}
export const CheckLabel = "Check";
export const CheckSchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      required: true,
      default: () => new Date() // Now
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: CaptureImageLabel
      }
    ],
    byDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DeviceLabel
    }
  },
  { _id: false, id: false }
);
export const Check = mongoose.model<ICheck>(CheckLabel, CheckSchema);
