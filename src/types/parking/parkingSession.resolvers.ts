import {
  ModelGetter,
  gqlPopulate,
  gqlPaged,
  gqlById
} from "../../db/genericResolvers";
import { Resolver, Context } from "../../db/gql";
import { IParkingSession } from "./parkingSession.model";
import dateFilter from "../dateFilter";
import { ICheck } from "./check.model";
import routes from "../../endpoints/routes";

const modelGetter: ModelGetter<IParkingSession> = ctx =>
  ctx.models.ParkingSession;

// Query
const parkingSessions: Resolver = gqlPaged(
  modelGetter,
  { max: 100, default: 50 },
  { active: -1, "checkIn.time": -1 },
  {}
);

const parkingSession: Resolver = gqlById(modelGetter);

const parkingSessionsFilter: Resolver = async (obj, args, ctx, info) => {
  if (!!args.filter) dateFilter(args, "date", "filter");
  return await parkingSessions(
    obj,
    {
      page: args.page,
      limit: args.limit,
      _find: !!args.date ? { "checkOut.time": args.date } : {}
    },
    ctx,
    info
  );
};

export default {
  Query: {
    parkingSessions,
    parkingSessionsFilter,
    parkingSession
  },
  ParkingSession: {
    vehicle: gqlPopulate(modelGetter, "vehicle")
  },
  Check: {
    imagePaths: (check: ICheck, _, ctx: Context) => {
      return check.images.map(id =>
        routes.captureImage.path.replace(":id", id)
      );
    }
  }
};
