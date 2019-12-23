import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";

const modelGetter: ModelGetter = ctx => ctx.models.ParkingRuleAssignment;

// Query
const parkingRuleAssignments: Resolver = gqlFindUsingFilter(modelGetter);

// Mutation
const createParkingRuleAssignment: Resolver = gqlCreate(modelGetter);
const updateParkingRuleAssignment: Resolver = gqlFindByIdUpdate(modelGetter);
const deleteParkingRuleAssignment: Resolver = gqlFindByIdDelete(modelGetter);

// ParkingRuleAssignment
const rules: Resolver = async (
  ruleAssignment: IParkingRuleAssignment,
  _,
  ctx
) => {
  const { rules } = await ctx.models.ParkingRuleAssignment.populate(
    ruleAssignment,
    { path: "rules" }
  );
  return rules;
};

const vehicleFilters: Resolver = async (
  ruleAssignment: IParkingRuleAssignment,
  _,
  ctx
) => {
  const { vehicleFilters } = await ctx.models.ParkingRuleAssignment.populate(
    ruleAssignment,
    { path: "vehicleFilters" }
  );
  return vehicleFilters;
};

export default {
  Query: {
    parkingRuleAssignments
  },
  Mutation: {
    createParkingRuleAssignment: checkPermissionsGqlBuilder(
      [],
      createParkingRuleAssignment
    ),
    updateParkingRuleAssignment: checkPermissionsGqlBuilder(
      [],
      updateParkingRuleAssignment
    ),
    deleteParkingRuleAssignment: checkPermissionsGqlBuilder(
      [],
      deleteParkingRuleAssignment
    )
  },
  ParkingRuleAssignment: {
    rules,
    vehicleFilters
  }
};
