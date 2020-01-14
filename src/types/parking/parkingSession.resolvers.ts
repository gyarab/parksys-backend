import {
  gqlFindUsingFilter,
  ModelGetter,
  gqlPopulate
} from "../../db/genericResolvers";
import { Resolver } from "../../db/gql";
import { IParkingSession } from "./parkingSession.model";

const modelGetter: ModelGetter<IParkingSession> = ctx =>
  ctx.models.ParkingSession;

// Query
const parkingSessions: Resolver = gqlFindUsingFilter(modelGetter);

export default {
  Query: {
    parkingSessions
  },
  ParkingSession: {
    vehicle: gqlPopulate(modelGetter, "vehicle")
  }
};
