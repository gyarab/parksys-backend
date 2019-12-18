import { defaultActivationPasswordGenerator, IDevice } from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import routes from "../../endpoints/routes";
import { Resolver } from "../../db/gql";
import { RefreshToken } from "../refreshToken/refreshToken.model";

// Query
const devices: Resolver = async (_, args, ctx) => {
  const devices = await ctx.models.Device.find(args.filter);
  return devices;
};

// Mutation
const createDevice: Resolver = async (_, args, ctx) => {
  return await new ctx.models.Device(args.input).save();
};

const deviceRegenerateActivationPassword: Resolver = async (_, args, ctx) => {
  const device = await ctx.models.Device.findById(args.id);
  if (!device) return null;
  device.activationPassword = defaultActivationPasswordGenerator();
  device.activated = false;
  device.activatedAt = null;
  await RefreshToken.findByIdAndRemove(device.refreshToken);
  device.refreshToken = null;
  return await device.save();
};

const deleteDevice: Resolver = async (_, args, ctx) => {
  return await ctx.models.Device.findByIdAndRemove(args.id);
};

// Device
const activationQrUrl = (device: IDevice) => {
  return routes["devices/qr"].path.replace(":id", device.id);
};

const activationPasswordExpiresAt = (obj: IDevice) => {
  return obj.activationPassword.payload.expiresAt;
};

export default {
  Query: {
    devices: checkPermissionsGqlBuilder([Permission.DEVICES], devices)
  },
  Mutation: {
    createDevice: checkPermissionsGqlBuilder(
      [Permission.DEVICES],
      createDevice
    ),
    deviceRegenerateActivationPassword: checkPermissionsGqlBuilder(
      [Permission.DEVICES],
      deviceRegenerateActivationPassword
    ),
    deleteDevice: checkPermissionsGqlBuilder([Permission.DEVICES], deleteDevice)
  },
  Device: {
    activationQrUrl,
    activationPasswordExpiresAt
  }
};
