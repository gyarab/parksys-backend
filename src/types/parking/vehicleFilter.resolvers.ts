import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { IVehicleFilter } from "./vehicleFilter.model";

const vfGetter: ModelGetter = ctx => ctx.models.VehicleFilter;

// Query
const vehicleFilters: Resolver = gqlFindUsingFilter(vfGetter);

// Mutation
const createVehicleFilter: Resolver = gqlCreate(vfGetter);
const updateVehicleFilter: Resolver = gqlFindByIdUpdate(vfGetter);
const deleteVehicleFilter: Resolver = gqlFindByIdDelete(vfGetter);

// VehicleFilter
const vehicles: Resolver = async (filter: IVehicleFilter, _, ctx) => {
  const { vehicles } = await ctx.models.VehicleFilter.populate(filter, {
    path: "vehicles"
  });
  return vehicles;
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
    ),
    deleteVehicleFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      deleteVehicleFilter
    )
  },
  VehicleFilter: {
    vehicles
  }
};
