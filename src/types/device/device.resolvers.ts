import { Device, DeviceOmittedFields } from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../../types/permissions";

// Query
const devices = async (_, args, ctx) => {
  return await Device.find(args.filter).select(DeviceOmittedFields);
};

// Mutation
const addDevice = async (_, args, ctx) => {
  return (await new Device(args.input).save()).publicFields();
};

export default {
  Query: {
    devices: checkPermissionsGqlBuilder([Permission.ALL], devices)
  },
  Mutation: {
    addDevice: checkPermissionsGqlBuilder([Permission.ALL], addDevice)
  }
};
