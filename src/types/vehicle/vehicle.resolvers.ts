import { Resolver, Context } from "../../db/gql";
import {
  gqlCreate,
  ModelGetter,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlRegexSearch,
  gqlPaged,
  gqlById,
} from "../../db/genericResolvers";
import { IVehicle } from "./vehicle.model";
import dateFilter from "../dateFilter";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";
import { Permission } from "../permissions";

const modelGetter: ModelGetter<IVehicle> = (ctx) => ctx.models.Vehicle;

// Query
const vehicles: Resolver = gqlFindUsingFilter(modelGetter);
const vehicleSearch: Resolver = gqlRegexSearch(
  modelGetter,
  "licensePlate",
  { max: 100, default: 50 },
  false
);
const vehicle: Resolver = gqlById(modelGetter);

// Mutation
const createVehicle: Resolver = gqlCreate(modelGetter);
const deleteVehicle: Resolver = gqlFindByIdDelete(modelGetter);
const deleteVehicleByLicensePlate: Resolver = async (_, args, ctx) => {
  return await ctx.models.Vehicle.findOneAndDelete({
    licensePlate: args.licensePlate,
  });
};

// Vehicle
const _parkingSessions: Resolver = gqlPaged(
  (ctx) => ctx.models.ParkingSession,
  { default: 10, max: 50 },
  { active: -1, "checkIn.time": -1 }
);

const parkingSessions: Resolver = async (
  vehicle: IVehicle,
  args,
  ctx: Context
) => {
  args._find = { vehicle: vehicle._id };
  const { filter, ...query } = args || {};
  if (!!filter) {
    const date = dateFilter(filter);
    query._find["$or"] = [{ "checkOut.time": date }, { "checkIn.time": date }];
  }
  return await _parkingSessions(null, query, ctx);
};

const numParkingSessions = async (vehicle: IVehicle, _, ctx: Context) =>
  ctx.models.ParkingSession.countDocuments({
    vehicle: vehicle.id,
  });

const totalPaidCents = async (vehicle: IVehicle, _, ctx: Context) => {
  const result = await ctx.models.ParkingSession.aggregate([
    { $match: { vehicle: vehicle._id } },
    { $group: { _id: 0, totalPaidCents: { $sum: "$finalFee" } } },
  ]);
  if (result.length === 0) return 0;
  return result[0].totalPaidCents;
};

export default {
  Query: {
    vehicle: checkPermissionsGqlBuilder([Permission.VEHICLES], vehicle),
    vehicles: checkPermissionsGqlBuilder([Permission.VEHICLES], vehicles),
    vehicleSearch: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      vehicleSearch
    ),
  },
  Mutation: {
    createVehicle: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      createVehicle
    ),
    deleteVehicle: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      deleteVehicle
    ),
    deleteVehicleByLicensePlate: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      deleteVehicleByLicensePlate
    ),
  },
  Vehicle: {
    parkingSessions,
    numParkingSessions,
    totalPaidCents,
  },
};
