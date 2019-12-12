import mongoose, { Model } from "mongoose";
import {
  IAuthentication,
  AuthenticationSchema,
  AuthenticationMethod,
  IAuthenticationPayloadActivationPassword,
  Authentication
} from "../authentication/authentication.model";
import crypto from "crypto";
import {
  IRefreshToken,
  RefreshTokenName
} from "../refreshToken/refreshToken.model";
import config from "../../config";

// Returns a function that generates activation passwords
export const generateDeviceActivationPassword: (
  nBytes: number
) => () => IAuthentication<IAuthenticationPayloadActivationPassword> = (
  n: number
) => {
  // Hex string length = 2 * nBytes
  const generateDeviceActivationPassword = () => {
    const token = new Authentication({
      payload: {
        password: crypto.randomBytes(n).toString("hex"),
        expiresAt: new Date(
          new Date().getTime() +
            config.get("security:activationPasswordDuration")
        )
      },
      method: AuthenticationMethod.ACTIVATION_PASSWORD
    });
    return token;
  };
  return generateDeviceActivationPassword;
};

interface IDevice extends mongoose.Document {
  name: string;
  activated: boolean;
  activatedAt: Date;
  activationPassword: IAuthentication<IAuthenticationPayloadActivationPassword>;
  refreshToken: IRefreshToken;
  config?: object;
  shouldSendConfig: boolean;
  defaultActivationPasswordGenerator: string;
}

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
    refreshToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: RefreshTokenName
    },
    config: {
      type: {},
      default: {}
    },
    shouldSendConfig: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.activationPassword;
        delete ret.refreshToken;
      }
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.activationPassword;
        delete ret.refreshToken;
      }
    }
  }
);

DeviceSchema.statics.defaultActivationPasswordGenerator = defaultActivationPasswordGenerator;

const Device = mongoose.model<IDevice>(DeviceName, DeviceSchema);

export {
  DeviceSchema,
  Device,
  DeviceName,
  IDevice,
  defaultActivationPasswordGenerator
};
