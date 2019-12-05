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
  RefreshTokenName
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
  activationPassword: IAuthentication<IAuthenticationPayloadActivationPassword>;
  refreshToken: IRefreshToken;
  activationQrUrl?: string;
  config?: object;
  shouldSendConfig: boolean;
  activationPasswordExpiresAt: Date;
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

DeviceSchema.virtual("activationQrUrl").get(function() {
  return routes["devices/qr"].path.replace(":id", this.id);
});

DeviceSchema.virtual("activationPasswordExpiresAt").get(function() {
  return this.activationPassword.payload.expiresAt;
});

const Device = mongoose.model<IDeviceDocument>(DeviceName, DeviceSchema);

export {
  DeviceSchema,
  Device,
  DeviceName,
  IDevice,
  IDeviceDocument,
  defaultActivationPasswordGenerator
};
