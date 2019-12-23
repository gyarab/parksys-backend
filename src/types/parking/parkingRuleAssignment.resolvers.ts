import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlPopulate
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";

const modelGetter: ModelGetter<IParkingRuleAssignment> = ctx =>
  ctx.models.ParkingRuleAssignment;

// Query
const parkingRuleAssignments: Resolver = gqlFindUsingFilter(modelGetter);

// Mutation
const createParkingRuleAssignment: Resolver = gqlCreate(modelGetter);
const updateParkingRuleAssignment: Resolver = gqlFindByIdUpdate(modelGetter);
const deleteParkingRuleAssignment: Resolver = gqlFindByIdDelete(modelGetter);

// ParkingRuleAssignment
const rules: Resolver = gqlPopulate(modelGetter, "rules");

const vehicleFilters: Resolver = gqlPopulate(modelGetter, "vehicleFilters");

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
