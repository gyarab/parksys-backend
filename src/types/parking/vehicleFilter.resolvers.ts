import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlPopulate
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { IVehicleFilter } from "./vehicleFilter.model";

const modelGetter: ModelGetter<IVehicleFilter> = ctx =>
  ctx.models.VehicleFilter;

// Query
const vehicleFilters: Resolver = gqlFindUsingFilter(modelGetter);

// Mutation
const createVehicleFilter: Resolver = gqlCreate(modelGetter);
const updateVehicleFilter: Resolver = gqlFindByIdUpdate(modelGetter);
const deleteVehicleFilter: Resolver = gqlFindByIdDelete(modelGetter);

// VehicleFilter
const vehicles: Resolver = gqlPopulate(modelGetter, "vehicles");

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
