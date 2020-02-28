import mongoose from "mongoose";

export enum DeviceType {
  IN = "IN",
  OUT = "OUT"
}

export interface IDeviceConfig extends mongoose.Document {
  type: DeviceType;
  capturing: boolean;
  minArea: number;
  resizeX: number;
  resizeY: number;
}

const validateLeq = (threshold: number) => ({
  validator: function(this: IDeviceConfig, value: Number) {
    return value >= threshold;
  }
});

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
    },
    minArea: {
      type: Number,
      require: true,
      default: 0,
      validate: validateLeq(0)
    },
    resizeX: {
      type: Number,
      require: true,
      default: 1000,
      validate: validateLeq(200)
    },
    resizeY: {
      type: Number,
      require: true,
      default: 1000,
      validate: validateLeq(200)
    }
  },
  { _id: false, id: false }
);
export const DeviceConfig = mongoose.model<IDeviceConfig>(
  DeviceConfigLabel,
  DeviceConfigSchema
);
