import { Device, defaultActivationPasswordGenerator } from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../../types/permissions";

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
  }
};
