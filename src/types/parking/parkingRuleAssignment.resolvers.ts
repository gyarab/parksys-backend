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
import mongoose, { Model } from "mongoose";
import dateFilter from "../dateFilter";
import { Permission } from "../permissions";
import { findAppliedRules } from "../../endpoints/device/capture/ruleResolver";
import lodash from "lodash";

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

const _duplicate = (doc: mongoose.Document) => {
  // Delete id
  const obj = doc.toObject();
  delete obj["_id"];
  delete obj["id"];
  return obj;
};

const duplicateParkingRuleAssignments: Resolver = async (
  _,
  { start, end, targetStarts, options },
  ctx
) => {
  if (start.getTime() > end.getTime()) {
    throw new Error("start > end");
  }
  const trim = lodash.get(options, "trim", true);
  const onCollisionFail = lodash.get(options, "onCollisionFail", true);
  const filter = lodash.get(options, "filter", {});
  const promises = targetStarts.map(
    async (targetStart): Promise<any> => {
      const difference = targetStart.getTime() - start.getTime();
      // Find PRAs
      const source = await ctx.models.ParkingRuleAssignment.find({
        ...filter,
        start: { $lte: end },
        end: { $gte: start }
      });
      const duplicates = source.map(async assignment => {
        const copy = _duplicate(assignment);
        if (trim) {
          copy.start = new Date(Math.max(copy.start, start));
          copy.end = new Date(Math.min(copy.end, end));
        }
        // Offset start and end
        copy.start = new Date(copy.start.getTime() + difference);
        copy.end = new Date(copy.end.getTime() + difference);

        const { collisions } = await __verifyNoCollisions(
          { id: "000000000000000000000000", input: copy },
          assignment,
          ctx.models.ParkingRuleAssignment
        );
        return collisions === -1 ? copy : null;
      });
      const resolved = await Promise.all(duplicates);
      if (onCollisionFail && resolved.some(t => t === null)) {
        // TODO: Handle this better with a result.
        throw new Error("There are collisions.");
      }
      return await ctx.models.ParkingRuleAssignment.create(
        resolved.filter(t => t !== null)
      );
    }
  );
  const results = await Promise.all(promises);
  return results;
};

const deleteParkingRuleAssignments: Resolver = async (
  _,
  { start, end, options },
  ctx
) => {
  if (start.getTime() > end.getTime()) {
    throw new Error("start > end");
  }
  const trim = lodash.get(options, "trim", true);
  const filter = lodash.get(options, "filter", {});
  if (trim) {
    // Delete those that are wholly between start and end
    await ctx.models.ParkingRuleAssignment.deleteMany({
      ...filter,
      start: { $gte: start },
      end: { $lte: end }
    });
    // Trim the rest
    await Promise.all([
      // Start is outside, end is inside
      ctx.models.ParkingRuleAssignment.updateMany(
        { ...filter, start: { $lt: start }, end: { $gt: start, $lte: end } },
        { $set: { end: start } }
      ),
      // End is outside, start is inside
      ctx.models.ParkingRuleAssignment.updateMany(
        { ...filter, start: { $gte: start, $lt: end }, end: { $gt: end } },
        { $set: { start: end } }
      ),
      // Both start and end are outside -> divide into two assignments
      ctx.models.ParkingRuleAssignment.find({
        ...filter,
        end: { $gt: end },
        start: { $lt: start }
      }).then(results => {
        const copies = results.map(a => {
          const copy = _duplicate(a);
          copy.start = end;
          return copy;
        });
        results.forEach(a => (a.end = start));
        return Promise.all([
          ctx.models.ParkingRuleAssignment.create(copies),
          Promise.all(results.map(r => r.save()))
        ]);
      })
    ]);
  } else {
    await ctx.models.ParkingRuleAssignment.deleteMany({
      ...filter,
      start: { $lte: end },
      end: { $gte: start }
    });
  }
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
