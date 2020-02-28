import mongoose from "mongoose";

export interface ICaptureImage extends mongoose.Document {
  data: string;
}
export const CaptureImageLabel = "CaptureImage";
export const CaptureImageSchema = new mongoose.Schema({
  data: {
    type: String,
    require: true
  }
});
export const CaptureImage = mongoose.model<ICaptureImage>(
  CaptureImageLabel,
  CaptureImageSchema
);
