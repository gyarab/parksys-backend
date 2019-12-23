import { Resolver } from "../../db/gql";
import {
  IParkingRulePermitAccess,
  IParkingRuleTimedFee
} from "./parkingRule.model";
import {
  gqlFindByIdUpdate,
  ModelGetter,
  gqlFindUsingFilter,
  gqlCreate
} from "../../db/genericResolvers";

const ruleModelGetter: ModelGetter = ctx => ctx.models.ParkingRule;
const permitAccessModelGetter: ModelGetter = ctx =>
  ctx.models.ParkingRulePermitAccess;

// Query
const parkingRules: Resolver = gqlFindUsingFilter(ruleModelGetter);

// Mutation
const createParkingRulePermitAccess: Resolver = gqlCreate(
  permitAccessModelGetter
);
const updateParkingRulePermitAccess: Resolver = gqlFindByIdUpdate(
  permitAccessModelGetter
);

// ParkingRuleTimedFee

// ParkingRulePermitAccess

export default {
  Query: {
    parkingRules
  },
  ParkingRule: {
    __resolveType(
      parkingRule: IParkingRulePermitAccess | IParkingRuleTimedFee
    ) {
      return parkingRule.__t;
    }
  },
  Mutation: {
    createParkingRulePermitAccess,
    updateParkingRulePermitAccess
  }
};
