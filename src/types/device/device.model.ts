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
import {
  DeviceConfigSchema,
  DeviceConfig,
  IDeviceConfig
} from "./deviceConfig.model";

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

export interface IDevice extends mongoose.Document {
  name: string;
  activated: boolean;
  lastContact: Date;
  activatedAt: Date;
  activationPassword: IAuthentication<IAuthenticationPayloadActivationPassword>;
  refreshToken: IRefreshToken;
  config?: IDeviceConfig;
  shouldSendConfig: boolean;
  defaultActivationPasswordGenerator: string;
  cacheKey(): string;
}

export const DeviceLabel = "Device";

export const defaultActivationPasswordGenerator = generateDeviceActivationPassword(
  64
);
export const DeviceSchema = new mongoose.Schema(
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
    lastContact: {
      type: Date,
      required: false
    },
    activatedAt: Date,
    refreshToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: RefreshTokenName
    },
    config: {
      type: DeviceConfigSchema,
      required: true,
      default: () => new DeviceConfig()
    },
    shouldSendConfig: {
      type: Boolean,
      required: true,
      default: true
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
DeviceSchema.methods.cacheKey = function(this: IDevice) {
  return `${DeviceLabel}:${this.config.type}:${this.id}`;
};

export const Device = mongoose.model<IDevice>(DeviceLabel, DeviceSchema);
