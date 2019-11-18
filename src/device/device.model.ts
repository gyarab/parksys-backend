import mongoose from "mongoose";
import {
  IAuthentication,
  AuthenticationSchema,
  AuthenticationMethod
} from "../authentication/authentication.model";
import crypto from "crypto";

// Returns a function that generates activation passwords
export const generateDeviceActivationPassword: (
  nBytes: number
) => () => IAuthentication = (n: number) => {
  // Hex string length = 2 * nBytes
  const generateDeviceActivationPassword = () => {
    const token: IAuthentication = {
      payload: crypto.randomBytes(n).toString("hex"),
      method: AuthenticationMethod.ACTIVATION_PASSWORD
    };
    return token;
  };
  return generateDeviceActivationPassword;
};

interface IDevice {
  name: string;
  activated: boolean;
  activatedAt: Date;
  activationPassword: IAuthentication;
  accessToken: null;
  activationQrUrl?: string;
}

interface IDeviceDocument extends mongoose.Document, IDevice {}

const DeviceName = "Device";

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  },
  activationPassword: {
    type: AuthenticationSchema,
    require: true,
    default: generateDeviceActivationPassword(64)
  },
  activated: {
    type: Boolean,
    required: true,
    default: false
  },
  activatedAt: {
    type: Date
  },
  refreshToken: AuthenticationSchema
});

DeviceSchema.virtual("activationQrUrl").get(function() {
  return "path";
});

const Device = mongoose.model<IDeviceDocument>(DeviceName, DeviceSchema);

export { DeviceSchema, Device, DeviceName, IDevice, IDeviceDocument };
