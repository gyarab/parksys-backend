import { Resolver } from "../../db/gql";
import {
  gqlCreate,
  ModelGetter,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlRegexSearch
} from "../../db/genericResolvers";
import { IVehicle } from "./vehicle.model";

const modelGetter: ModelGetter<IVehicle> = ctx => ctx.models.Vehicle;

// Query
const vehicles: Resolver = gqlFindUsingFilter(modelGetter);
const vehicleSearch: Resolver = gqlRegexSearch(modelGetter, "licensePlate", {
  max: 100,
  default: 50
});

// Mutation
const createVehicle: Resolver = gqlCreate(modelGetter);
const deleteVehicle: Resolver = gqlFindByIdDelete(modelGetter);
const deleteVehicleByLicensePlate: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.findOneAndDelete({
    licensePlate: args.licensePlate
  });
};

export default {
  Query: {
    vehicles,
    vehicleSearch
  },
  Mutation: {
    createVehicle,
    deleteVehicle,
    deleteVehicleByLicensePlate
  }
};
