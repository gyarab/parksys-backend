import { Device } from "./device.model";
import lodash from "lodash";

// Query
// TODO: Lockdown using permissions
const devices = async (_, args, ctx) => {
  return await Device.find({});
};

const activatedDevices = async (_, args, ctx) => {
  return await Device.find({ activated: true });
};

const notActivatedDevices = async (_, args, ctx) => {
  return await Device.find({ activated: false });
};

// Mutation
const addDevice = async (_, args, ctx) => {
  console.log(args);
  console.log(args.input);
  return await new Device(args.input).save();
};

export default {
  Query: {
    devices,
    activatedDevices,
    notActivatedDevices
  },
  Mutation: {
    addDevice
  }
};
