import { Resolver, Context } from "../../db/gql";
import {
  gqlCreate,
  ModelGetter,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlRegexSearch,
  gqlPaged,
  gqlById
} from "../../db/genericResolvers";
import { IVehicle } from "./vehicle.model";
import dateFilter from "../dateFilter";

const modelGetter: ModelGetter<IVehicle> = ctx => ctx.models.Vehicle;

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
    licensePlate: args.licensePlate
  });
};

// Vehicle
const _parkingSessions: Resolver = gqlPaged(
  ctx => ctx.models.ParkingSession,
  { default: 10, max: 50 },
  { "checkIn.time": -1 }
);

export default {
  Query: { vehicle, vehicles, vehicleSearch },
  Mutation: {
    createVehicle,
    deleteVehicle,
    deleteVehicleByLicensePlate
  },
  Vehicle: {
    parkingSessions: async (vehicle: IVehicle, args, ctx: Context) => {
      args._find = { vehicle: vehicle._id };
      if (!!args.filter) {
        dateFilter(args, "date", "filter");
        args._find["$or"] = [
          { "checkOut.time": args.date },
          { "checkIn.time": args.date }
        ];
        delete args.date;
      }
      return await _parkingSessions(null, args, ctx);
    },
    numParkingSessions: async (vehicle: IVehicle, _, ctx: Context) =>
      ctx.models.ParkingSession.countDocuments({
        vehicle: vehicle.id
      }),
    totalPaidCents: async (vehicle: IVehicle, _, ctx: Context) => {
      const result = await ctx.models.ParkingSession.aggregate([
        { $match: { vehicle: vehicle._id } },
        { $group: { _id: 0, totalPaidCents: { $sum: "$finalFee" } } }
      ]);
      if (result.length === 0) return 0;
      return result[0].totalPaidCents;
    }
  }
};
