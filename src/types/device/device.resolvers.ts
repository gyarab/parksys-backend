import {
  Device,
  defaultActivationPasswordGenerator,
  IDeviceDocument
} from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../../types/permissions";
import routes from "../../endpoints/routes";

// Query
const devices = async (_, args, ctx) => {
  const devices = await Device.find(args.filter);
  return devices;
};

// Mutation
const addDevice = async (_, args, ctx) => {
  return await new Device(args.input).save();
};

const regenerateActivationPassword = async (_, args, ctx) => {
  const device = await Device.findById(args.id);
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
