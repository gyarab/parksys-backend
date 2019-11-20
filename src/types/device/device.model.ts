import mongoose from "mongoose";
import {
  IAuthentication,
  AuthenticationSchema,
  AuthenticationMethod,
  IAuthenticationPayloadActivationPassword
} from "../authentication/authentication.model";
import crypto from "crypto";
import {
  IRefreshToken,
  RefreshTokenSchema
} from "../refreshToken/refreshToken.model";

// Returns a function that generates activation passwords
export const generateDeviceActivationPassword: (
  nBytes: number
) => () => IAuthentication<IAuthenticationPayloadActivationPassword> = (n: number) => {
  // Hex string length = 2 * nBytes
  const generateDeviceActivationPassword = () => {
    const token: IAuthentication<IAuthenticationPayloadActivationPassword> = {
      payload: {
        password: crypto.randomBytes(n).toString("hex"),
        expiresAt: new Date(new Date().getTime() + 1000 * 60 * 5) // Add 5 minutes
      },
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
  activationPassword: IAuthentication<any>;
  refreshToken: IRefreshToken;
  activationQrUrl?: string;
  publicFields?(): IDevice
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
    required: true,
    default: generateDeviceActivationPassword(64)
  },
  activated: {
    type: Boolean,
    required: true,
    default: false
  },
  activatedAt: Date,
  refreshToken: RefreshTokenSchema
});

const DeviceOmittedFields = "-activationPassword -refreshToken";

DeviceSchema.methods.publicFields = function() {
  return {
    id: this.id,
    name: this.name,
    activated: this.activated,
    activatedAt: this.activatedAt
  }
}

DeviceSchema.virtual("activationQrUrl").get(function() {
  return "path";
});

const Device = mongoose.model<IDeviceDocument>(DeviceName, DeviceSchema);

export { DeviceSchema, Device, DeviceName, IDevice, IDeviceDocument, DeviceOmittedFields };
