import { Resolver } from "../../db/gql";

// Query
const vehicles: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.find(args || {});
};

// Mutation
const createVehicle: Resolver = async (_, args, ctx) => {
  return await new ctx.models.Vehicle(args.input).save();
};

const deleteVehicle: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.findByIdAndRemove(args.id);
};

const deleteVehicleByLicensePlate: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.findOneAndDelete({
    licensePlate: args.licensePlate
  });
};

export default {
  Query: {
    vehicles
  },
  Mutation: {
    createVehicle,
    deleteVehicle,
    deleteVehicleByLicensePlate
  }
};
