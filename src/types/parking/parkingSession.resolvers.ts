import {
  ModelGetter,
  gqlPopulate,
  gqlPaged,
  gqlById,
} from "../../db/genericResolvers";
import { Resolver, Context } from "../../db/gql";
import { IParkingSession } from "./parkingSession.model";
import dateFilter from "../dateFilter";
import { ICheck } from "./check.model";
import routes from "../../endpoints/routes";
import { Permission } from "../permissions";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";

const modelGetter: ModelGetter<IParkingSession> = (ctx) =>
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
  const { filter: dateFilter, ...query } = args || {};
  return await parkingSessions(
    obj,
    {
      ...query,
      _find: !!dateFilter ? { "checkOut.time": dateFilter(dateFilter) } : {},
    },
    ctx,
    info
  );
};

// Check
const imagePaths: Resolver = (check: ICheck) => {
  return check.images.map((id) => routes.captureImage.path.replace(":id", id));
};

export default {
  Query: {
    parkingSessions: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      parkingSessions
    ),
    parkingSessionsFilter: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      parkingSessionsFilter
    ),
    parkingSession: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      parkingSession
    ),
  },
  ParkingSession: {
    vehicle: gqlPopulate(modelGetter, "vehicle"),
  },
  Check: {
    imagePaths,
  },
};
