import mongoose from "mongoose";

export enum DeviceType {
  IN = "IN",
  OUT = "OUT"
}

export interface IDeviceConfig extends mongoose.Document {
  type: DeviceType;
  capturing: boolean;
}

export const DeviceConfigLabel = "DeviceConfig";
export const DeviceConfigSchema = new mongoose.Schema<IDeviceConfig>(
  {
    type: {
      type: String,
      required: true,
      default: DeviceType.IN,
      enum: Object.keys(DeviceType)
    },
    capturing: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  { _id: false, id: false }
);
export const DeviceConfig = mongoose.model<IDeviceConfig>(
  DeviceConfigLabel,
  DeviceConfigSchema
);
