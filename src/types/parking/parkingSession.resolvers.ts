import { ModelGetter, gqlPopulate, gqlPaged } from "../../db/genericResolvers";
import { Resolver } from "../../db/gql";
import { IParkingSession } from "./parkingSession.model";

const modelGetter: ModelGetter<IParkingSession> = ctx =>
  ctx.models.ParkingSession;

// Query
const parkingSessions: Resolver = gqlPaged(
  modelGetter,
  { max: 100, default: 50 },
  { "checkOut.time": 1 },
  {}
);

export default {
  Query: {
    parkingSessions
  },
  ParkingSession: {
    vehicle: gqlPopulate(modelGetter, "vehicle")
  }
};
