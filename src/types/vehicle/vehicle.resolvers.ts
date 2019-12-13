import { Resolver } from "../../db/gql";

// Query
const vehicles: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.find(args || {});
};

// Mutation
const createVehicle: Resolver = async (_, args, ctx) => {
  return await new ctx.models.Vehicle(args.input).save();
};

export default {
  Query: {
    vehicles
  },
  Mutation: {
    createVehicle
  }
};
