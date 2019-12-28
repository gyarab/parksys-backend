import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlPopulate,
  gqlRegexSearch
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { IVehicleFilter } from "./vehicleFilter.model";

const modelGetter: ModelGetter<IVehicleFilter> = ctx =>
  ctx.models.VehicleFilter;

// Query
const vehicleFilters: Resolver = gqlFindUsingFilter(modelGetter);
const vehicleFilterSearch: Resolver = gqlRegexSearch(modelGetter, "name", {
  max: 100,
  default: 50
});

// Mutation
const createVehicleFilter: Resolver = gqlCreate(modelGetter);
const updateVehicleFilter: Resolver = gqlFindByIdUpdate(modelGetter);
const deleteVehicleFilter: Resolver = gqlFindByIdDelete(modelGetter);

// VehicleFilter
const vehicles: Resolver = gqlPopulate(modelGetter, "vehicles");

export default {
  Query: {
    vehicleFilters,
    vehicleFilterSearch
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
