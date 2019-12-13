import { Resolver } from "../../db/gql";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { IVehicleFilter } from "./vehicleFilter.model";

// Query
const vehicleFilters: Resolver = async (_, args, ctx) => {
  return await ctx.models.VehicleFilter.find({});
};

const vehicles: Resolver = async (filter: IVehicleFilter, _, ctx) => {
  const vehs: IVehicleFilter = await ctx.models.VehicleFilter.populate(filter, {
    path: "vehicles"
  });
  return vehs.vehicles;
};

// Mutation
const createVehicleFilter: Resolver = async (_, args, ctx) => {
  return await new ctx.models.VehicleFilter(args.input).save();
};

const updateVehicleFilter: Resolver = async (_, args, ctx) => {
  return await ctx.models.VehicleFilter.findOneAndUpdate(
    { _id: args.id },
    args.input
  );
};

export default {
  Query: {
    vehicleFilters
  },
  Mutation: {
    createVehicleFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      createVehicleFilter
    ),
    updateVehicleFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      updateVehicleFilter
    )
  },
  VehicleFilter: {
    vehicles
  }
};
