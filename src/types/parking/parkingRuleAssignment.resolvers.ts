import { Resolver, Context } from "../../db/gql";
import {
  ModelGetter,
  gqlCreate,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlPopulate,
} from "../../db/genericResolvers";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";
import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";
import { applyRules } from "../../endpoints/device/capture/ruleApplier";
import dateFilter from "../dateFilter";
import { Permission } from "../permissions";
import { findAppliedRules } from "../../endpoints/device/capture/ruleResolver";
import lodash from "lodash";
import {
  countCollisions,
  checkCollisionsWhenDuplicating,
} from "./parkingRuleAssignmentHelpers";
import { duplicateDocument } from "../../utils/modelHelpers";

const modelGetter: ModelGetter<IParkingRuleAssignment> = (ctx) =>
  ctx.models.ParkingRuleAssignment;

// Query
const parkingRuleAssignments: Resolver = async (_, args, ctx) => {
  let { startFilter, endFilter, ...query } = args.filter || {};
  if (!!startFilter) {
    query.start = dateFilter(startFilter);
  }
  if (!!endFilter) {
    query.end = dateFilter(endFilter);
  }
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
    feeCents: results.feeCents,
  };
};

// Mutation
const _createParkingRuleAssignment: Resolver = gqlCreate(modelGetter);
const createParkingRuleAssignment: Resolver = async (obj, args, ctx, info) => {
  const collisions = await countCollisions(
    args,
    {},
    ctx.models.ParkingRuleAssignment
  );
  if (collisions.length === 0) {
    return await _createParkingRuleAssignment(obj, args, ctx, info);
  } else {
    return { collisions };
  }
};

const _updateParkingRuleAssignment: Resolver = gqlFindByIdUpdate(modelGetter);
const updateParkingRuleAssignment: Resolver = async (obj, args, ctx, info) => {
  const current = await ctx.models.ParkingRuleAssignment.findById(args.id);
  const collisions = await countCollisions(
    args,
    current.toObject(),
    ctx.models.ParkingRuleAssignment
  );
  if (collisions.length === 0) {
    return await _updateParkingRuleAssignment(obj, args, ctx, info);
  } else {
    return { collisions };
  }
};
const deleteParkingRuleAssignment: Resolver = gqlFindByIdDelete(modelGetter);

const duplicateParkingRuleAssignments: Resolver = async (_, args, ctx) => {
  if (args.start.getTime() > args.end.getTime()) {
    throw new Error("start > end");
  } else if (args.targetStarts.length === 0) {
    throw new Error("need to supply at least one targetStart");
  }

  const [assignmentCreators, collisions] = await checkCollisionsWhenDuplicating(
    args,
    ctx
  );

  if (collisions.length > 0) {
    return {
      _t: "ParkingRuleAssignmentResultError",
      collisions: collisions.flat(1),
    };
  }

  const newAssignments = await Promise.all(
    assignmentCreators.map((creator) => creator())
  );
  return {
    _t: "ParkingRuleAssignmentDuplicationResult",
    newAssignments,
  };
};

const deleteParkingRuleAssignments: Resolver = async (
  _,
  { start: deleteStart, end: deleteEnd, options },
  ctx
) => {
  if (deleteStart.getTime() > deleteEnd.getTime()) {
    throw new Error("start > end");
  }
  const trim = lodash.get(options, "trim", true);
  const filter = lodash.get(options, "filter", {});
  if (trim) {
    // Trim the rest
    await Promise.all([
      // Delete those that are wholly between start and end
      ctx.models.ParkingRuleAssignment.deleteMany({
        ...filter,
        start: { $gte: deleteStart },
        end: { $lte: deleteEnd },
      }),
      // Start is outside, end is inside
      ctx.models.ParkingRuleAssignment.updateMany(
        {
          ...filter,
          start: { $lt: deleteStart },
          end: { $gt: deleteStart, $lte: deleteEnd },
        },
        { $set: { end: deleteStart } }
      ),
      // End is outside, start is inside
      ctx.models.ParkingRuleAssignment.updateMany(
        {
          ...filter,
          start: { $gte: deleteStart, $lt: deleteEnd },
          end: { $gt: deleteEnd },
        },
        { $set: { start: deleteEnd } }
      ),
      // Both start and end are outside -> divide into two assignments
      ctx.models.ParkingRuleAssignment.find({
        ...filter,
        end: { $gt: deleteEnd },
        start: { $lt: deleteStart },
      }).then((results) => {
        const copies = results.map((a) => {
          const copy = duplicateDocument(a);
          copy.start = deleteEnd;
          return copy;
        });
        results.forEach((a) => (a.end = deleteStart));
        return Promise.all([
          ctx.models.ParkingRuleAssignment.create(copies),
          Promise.all(results.map((r) => r.save())),
        ]);
      }),
    ]);
  } else {
    await ctx.models.ParkingRuleAssignment.deleteMany({
      ...filter,
      start: { $lte: deleteEnd },
      end: { $gte: deleteStart },
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
    ),
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
    ),
  },
  ParkingRuleAssignment: {
    rules: checkPermissionsGqlBuilder([Permission.VEHICLES], rules),
    vehicleFilters: checkPermissionsGqlBuilder(
      [Permission.VEHICLES],
      vehicleFilters
    ),
  },
  ParkingRuleAssignmentResult: {
    __resolveType(obj) {
      if (obj.collisions) {
        return "ParkingRuleAssignmentResultError";
      } else {
        return "ParkingRuleAssignment";
      }
    },
  },
  ParkingRuleAssignmentResultError: {
    // It should already be populated
    collisions: (obj, _, __, ___) => obj.collisions,
  },
  ParkingRuleAssignmentsResult: {
    __resolveType: (obj) => obj._t,
  },
};
