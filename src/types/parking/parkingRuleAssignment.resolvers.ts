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
import { applyRules } from "../../endpoints/device/capture/ruleApplier";
import { Model } from "mongoose";
import dateFilter from "../dateFilter";
import { Permission } from "../permissions";
import { findAppliedRules } from "../../endpoints/device/capture/ruleResolver";

const modelGetter: ModelGetter<IParkingRuleAssignment> = ctx =>
  ctx.models.ParkingRuleAssignment;

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
  const appliedRules = await findAppliedRules(
    await ctx.models.Vehicle.findById(vehicle),
    start,
    end
  );
  const [results] = await applyRules(appliedRules);
  return {
    appliedRules,
    feeCents: results.feeCents
  };
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

const duplicateParkingRuleAssignments: Resolver = async (
  _,
  { start, end, targetStarts },
  ctx
) => {
  if (start.getTime() > end.getTime()) {
    throw new Error("start > end");
  }
  // TODO: Add trimming option
  const promises = targetStarts.map(
    async (targetStart): Promise<any> => {
      const difference = targetStart.getTime() - start.getTime();
      // Find PRAs
      const source = await ctx.models.ParkingRuleAssignment.find({
        start: { $lte: end },
        end: { $gte: start }
      });
      const duplicates = source.map(assignment => {
        // Delete id and shallow copy values
        const obj = assignment.toObject();
        delete obj["_id"];
        delete obj["id"];
        const copy = { ...obj };
        // Offset start and end
        copy.start = new Date(copy.start.getTime() + difference);
        copy.end = new Date(copy.end.getTime() + difference);
        return copy;
      });
      return await ctx.models.ParkingRuleAssignment.create(duplicates);
    }
  );
  const results = await Promise.all(promises);
  return results;
};

const deleteParkingRuleAssignments: Resolver = async (
  _,
  { start, end },
  ctx
) => {
  if (start.getTime() > end.getTime()) {
    throw new Error("start > end");
  }
  // TODO: Add trimming option
  await ctx.models.ParkingRuleAssignment.deleteMany({
    start: { $lte: end },
    end: { $gte: start }
  });
  return true;
};

// ParkingRuleAssignment
const rules: Resolver = gqlPopulate(modelGetter, "rules");
const vehicleFilters: Resolver = gqlPopulate(modelGetter, "vehicleFilters");

export default {
  Query: {
    parkingRuleAssignments: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      parkingRuleAssignments
    ),
    simulateRuleAssignmentApplication: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      simulateRuleAssignmentApplication
    )
  },
  Mutation: {
    createParkingRuleAssignment: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      createParkingRuleAssignment
    ),
    updateParkingRuleAssignment: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      updateParkingRuleAssignment
    ),
    deleteParkingRuleAssignment: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      deleteParkingRuleAssignment
    ),
    duplicateParkingRuleAssignments: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      duplicateParkingRuleAssignments
    ),
    deleteParkingRuleAssignments: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      deleteParkingRuleAssignments
    )
  },
  ParkingRuleAssignment: {
    rules: checkPermissionsGqlBuilder([Permission.VEHICLES], rules),
    vehicleFilters: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      vehicleFilters
    )
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
