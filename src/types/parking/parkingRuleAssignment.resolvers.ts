import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlPopulate
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";
import { findAppliedRules } from "../../endpoints/device/capture";

const modelGetter: ModelGetter<IParkingRuleAssignment> = ctx =>
  ctx.models.ParkingRuleAssignment;

const dateFilter = (query, key, originalKey) => {
  if (!query[originalKey]) {
    delete query[originalKey];
    return;
  }
  const keys = ["lt", "lte", "gt", "gte"];
  const f = {};
  for (const k of keys) {
    if (query[originalKey][k] !== undefined) {
      f[`$${k}`] = query[originalKey][k];
    }
  }
  if (Object.keys(f).length > 0) {
    query[key] = f;
  }
  delete query[originalKey];
};

// Query
const parkingRuleAssignments: Resolver = async (_, args, ctx) => {
  let query = args.filter;
  if (!!query.startFilter) dateFilter(query, "start", "startFilter");
  if (!!query.endFilter) dateFilter(query, "end", "endFilter");
  return await ctx.models.ParkingRuleAssignment.find(query);
};

const simulateRuleAssignmentApplication: Resolver = async (
  _,
  { vehicle, start, end },
  ctx
) => {
  return await findAppliedRules(
    await ctx.models.Vehicle.findById(vehicle),
    start,
    end
  );
};

// Mutation
const createParkingRuleAssignment: Resolver = gqlCreate(modelGetter);
const updateParkingRuleAssignment: Resolver = gqlFindByIdUpdate(modelGetter);
const deleteParkingRuleAssignment: Resolver = gqlFindByIdDelete(modelGetter);

// ParkingRuleAssignment
const rules: Resolver = gqlPopulate(modelGetter, "rules");

const vehicleFilters: Resolver = gqlPopulate(modelGetter, "vehicleFilters");

export default {
  Query: {
    parkingRuleAssignments,
    simulateRuleAssignmentApplication
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
