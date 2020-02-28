import { ModelGetter, gqlPopulate, gqlPaged } from "../../db/genericResolvers";
import { Resolver } from "../../db/gql";
import { IParkingSession } from "./parkingSession.model";
import dateFilter from "../dateFilter";

const modelGetter: ModelGetter<IParkingSession> = ctx =>
  ctx.models.ParkingSession;

// Query
const parkingSessions: Resolver = gqlPaged(
  modelGetter,
  { max: 100, default: 50 },
  { "checkOut.time": -1, "checkIn.time": -1 },
  {}
);

const parkingSessionsFilter: Resolver = async (obj, args, ctx, info) => {
  if (!!args.filter) dateFilter(args, "date", "filter");
  return await parkingSessions(
    obj,
    {
      page: args.page,
      limit: args.limit,
      _find: !!args.date
        ? {
            "checkOut.time": args.date
          }
        : {}
    },
    ctx,
    info
  );
};

export default {
  Query: {
    parkingSessions,
    parkingSessionsFilter
  },
  ParkingSession: {
    vehicle: gqlPopulate(modelGetter, "vehicle")
  }
};
