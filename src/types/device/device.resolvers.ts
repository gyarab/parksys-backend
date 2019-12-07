import {
  defaultActivationPasswordGenerator,
  IDeviceDocument
} from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../../types/permissions";
import routes from "../../endpoints/routes";
import { Resolver } from "../../db/gql";

// Query
const devices = async (_, args, ctx) => {
  const devices = await ctx.models.Device.find(args.filter);
  return devices;
};

// Mutation
const addDevice = async (_, args, ctx) => {
  return await new ctx.models.Device(args.input).save();
};

const regenerateActivationPassword: Resolver = async (_, args, ctx) => {
  const device = await ctx.models.Device.findById(args.id);
  if (!device) return null;
  device.activationPassword = defaultActivationPasswordGenerator();
  return await device.save();
};

// Device
const activationQrUrl = (obj: IDeviceDocument) => {
  return routes["devices/qr"].path.replace(":id", obj.id);
};

const activationPasswordExpiresAt = (obj: IDeviceDocument) => {
  return obj.activationPassword.payload.expiresAt;
};

export default {
  Query: {
    devices: checkPermissionsGqlBuilder([Permission.ALL], devices)
  },
  Mutation: {
    addDevice: checkPermissionsGqlBuilder([Permission.ALL], addDevice),
    regenerateActivationPassword: checkPermissionsGqlBuilder(
      [Permission.ALL],
      regenerateActivationPassword
    )
  },
  Device: {
    activationQrUrl,
    activationPasswordExpiresAt
  }
};
