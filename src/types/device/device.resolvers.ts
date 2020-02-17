import { defaultActivationPasswordGenerator, IDevice } from "./device.model";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";
import { Permission } from "../permissions";
import routes from "../../endpoints/routes";
import { RefreshToken } from "../refreshToken/refreshToken.model";
import { Resolver } from "../../db/gql";
import {
  gqlFindByIdDelete,
  ModelGetter,
  gqlCreate,
  gqlFindUsingFilter
} from "../../db/genericResolvers";

const modelGetter: ModelGetter<IDevice> = ctx => ctx.models.Device;

// Query
const devices: Resolver = gqlFindUsingFilter(modelGetter);

// Mutation
const createDevice: Resolver = gqlCreate(modelGetter);
const deleteDevice: Resolver = gqlFindByIdDelete(modelGetter);

const deviceRegenerateActivationPassword: Resolver = async (_, args, ctx) => {
  const device = await ctx.models.Device.findById(args.id);
  if (!device) throw new Error("Device not found");
  device.activationPassword = defaultActivationPasswordGenerator();
  device.activated = false;
  device.activatedAt = null;
  await RefreshToken.findByIdAndRemove(device.refreshToken);
  device.refreshToken = null;
  return await device.save();
};

const updateDeviceConfig: Resolver = async (_, args, ctx): Promise<IDevice> => {
  const device = await ctx.models.Device.findById(args.id);
  device.config = { ...device.config.toObject(), ...args.config };
  await device.save();
  return device;
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
    deleteDevice: checkPermissionsGqlBuilder(
      [Permission.DEVICES],
      deleteDevice
    ),
    updateDeviceConfig: checkPermissionsGqlBuilder(
      [Permission.DEVICES],
      updateDeviceConfig
    )
  },
  Device: {
    activationQrUrl,
    activationPasswordExpiresAt
  }
};
