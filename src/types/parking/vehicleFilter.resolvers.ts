import { Resolver } from "../../db/gql";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";

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
  Mutation: {
    createVehicleFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      createVehicleFilter
    ),
    updateVehicleFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      updateVehicleFilter
    )
  }
};
