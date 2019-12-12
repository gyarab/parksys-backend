import { Resolver } from "../../db/gql";

const createVehicleFilter: Resolver = async (_, args, ctx) => {
  const vf = new ctx.models.VehicleFilter(args.input);
  return await vf.save();
};

const updateVehicleFilter: Resolver = async (_, args, ctx) => {
  const vehicleFilter = await ctx.models.VehicleFilter.findById(args.id);
  if (!vehicleFilter) throw new Error("Not found");
  if (args.input.name) vehicleFilter.name = args.input.name;
  if (args.input.inheritsFrom) {
    vehicleFilter.inheritsFrom = args.input.inheritsFrom;
  }
  if (args.input.action) vehicleFilter.action = args.input.action;
  console.log(vehicleFilter);

  return await vehicleFilter.save();
};

export default {
  Mutation: {
    createVehicleFilter,
    updateVehicleFilter
  }
};
