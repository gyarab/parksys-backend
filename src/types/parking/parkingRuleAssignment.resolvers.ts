import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlPopulate
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";
import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";
import { findAppliedRules } from "../../endpoints/device/capture";
import { Model } from "mongoose";

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
  let query = args.filter || {};
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
const __verifyNoCollisions = async (
  args: any,
  current: any,
  ParkingRuleAssignment: Model<IParkingRuleAssignment, {}>
) => {
  if (
    ["priority", "start", "end"].some(
      field => field in args.input && args.input[field] !== current[field]
    )
  ) {
    const newObj = { ...current, ...args.input };
    // Start <= End
    if (newObj.start.getTime() > newObj.end.getTime()) {
      throw new Error("start > end!");
    }
    const idSearch = !!args.id ? { _id: { $ne: args.id } } : {};
    const collisions = await ParkingRuleAssignment.find({
      ...idSearch,
      priority: newObj.priority,
      start: { $lt: newObj.end }, // not equal because assignments can start when one ends
      end: { $gt: newObj.start }
    });
    if (collisions.length > 0) {
      return { collisions };
    }
  }
  return { collisions: -1 };
};

const _createParkingRuleAssignment: Resolver = gqlCreate(modelGetter);
const createParkingRuleAssignment: Resolver = async (obj, args, ctx, info) => {
  const { collisions } = await __verifyNoCollisions(
    args,
    {},
    ctx.models.ParkingRuleAssignment
  );
  if (collisions === -1) {
    return await _createParkingRuleAssignment(obj, args, ctx, info);
  } else {
    return { collisions };
  }
};

const _updateParkingRuleAssignment: Resolver = gqlFindByIdUpdate(modelGetter);
const updateParkingRuleAssignment: Resolver = async (obj, args, ctx, info) => {
  const current = await ctx.models.ParkingRuleAssignment.findById(args.id);
  const { collisions } = await __verifyNoCollisions(
    args,
    current.toObject(),
    ctx.models.ParkingRuleAssignment
  );
  if (collisions === -1) {
    return await _updateParkingRuleAssignment(obj, args, ctx, info);
  } else {
    return { collisions };
  }
};
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
  },
  ParkingRuleAssignmentResult: {
    __resolveType(obj) {
      if (obj.collisions) {
        return "ParkingRuleAssignmentResultError";
      } else {
        return "ParkingRuleAssignment";
      }
    }
  },
  ParkingRuleAssignmentResultError: {
    collisions: (obj, _, __, ___) => {
      // It should already be populated
      return obj.collisions;
    }
  }
};
