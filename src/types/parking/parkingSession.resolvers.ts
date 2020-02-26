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
  { "checkOut.time": 1 },
  {}
);

const parkingSessionsFilter: Resolver = async (obj, args, ctx, info) => {
  const input = args.input;
  if (!!input.dateFilter) dateFilter(input, "date", "dateFilter");
  return await parkingSessions(
    obj,
    {
      page: input.page,
      limit: input.limit,
      _find: !!input.date
        ? {
            "checkOut.time": input.date
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
