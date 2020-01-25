import { Resolver } from "../../db/gql";
import {
  IParkingRulePermitAccess,
  IParkingRuleTimedFee,
  IParkingRule
} from "./parkingRule.model";
import {
  gqlFindByIdUpdate,
  ModelGetter,
  gqlFindUsingFilter,
  gqlCreate,
  gqlRegexSearch,
  gqlFindByIdDelete
} from "../../db/genericResolvers";

const ruleModelGetter: ModelGetter<IParkingRule> = ctx =>
  ctx.models.ParkingRule;
const permitAccessModelGetter: ModelGetter<IParkingRulePermitAccess> = ctx =>
  ctx.models.ParkingRulePermitAccess;

// Query
const parkingRules: Resolver = gqlFindUsingFilter(ruleModelGetter);
const parkingRuleSearch: Resolver = gqlRegexSearch(ruleModelGetter, "name", {
  max: 100,
  default: 50
});

const typeMapper = input => {
  const type = input._t;
  delete input._t;
  return {
    ...input,
    __t: type
  };
};

// Mutation
const createParkingRule: Resolver = gqlCreate(ruleModelGetter, typeMapper);

const updateParkingRule: Resolver = gqlFindByIdUpdate(
  ruleModelGetter,
  typeMapper
);

const deleteParkingRule: Resolver = gqlFindByIdDelete(ruleModelGetter);

// ParkingRuleTimedFee

// ParkingRulePermitAccess

export default {
  Query: {
    parkingRules,
    parkingRuleSearch
  },
  ParkingRule: {
    __resolveType(
      parkingRule: IParkingRulePermitAccess | IParkingRuleTimedFee
    ) {
      return parkingRule.__t;
    }
  },
  Mutation: {
    createParkingRule,
    updateParkingRule,
    deleteParkingRule
  }
};
