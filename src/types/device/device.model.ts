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
import routes from "../../endpoints/routes";
import config from "../../config";

// Returns a function that generates activation passwords
export const generateDeviceActivationPassword: (
  nBytes: number
) => () => IAuthentication<IAuthenticationPayloadActivationPassword> = (
  n: number
) => {
  // Hex string length = 2 * nBytes
  const generateDeviceActivationPassword = () => {
    const token: IAuthentication<IAuthenticationPayloadActivationPassword> = {
      payload: {
        password: crypto.randomBytes(n).toString("hex"),
        expiresAt: new Date(
          new Date().getTime() +
            config.get("security:activationPasswordDuration")
        )
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
  publicFields(): IDevice;
}

interface IDeviceDocument extends mongoose.Document, IDevice {}

const DeviceName = "Device";

const defaultActivationPasswordGenerator = generateDeviceActivationPassword(64);
const DeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      dropDups: true
    },
    activationPassword: {
      type: AuthenticationSchema,
      required: true,
      default: defaultActivationPasswordGenerator
    },
    activated: {
      type: Boolean,
      required: true,
      default: false
    },
    activatedAt: Date,
    refreshToken: RefreshTokenSchema
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

const DeviceOmittedFields = "-activationPassword -refreshToken";

DeviceSchema.methods.publicFields = function() {
  const device = this.toObject();
  delete device._id;
  delete device.activationPassword;
  delete device.refreshToken;
  return device;
};

DeviceSchema.virtual("activationQrUrl").get(function() {
  return routes["devices/qr"].path.replace(":id", this.id);
});

const Device = mongoose.model<IDeviceDocument>(DeviceName, DeviceSchema);

export {
  DeviceSchema,
  Device,
  DeviceName,
  IDevice,
  IDeviceDocument,
  DeviceOmittedFields,
  defaultActivationPasswordGenerator
};
