import { IParkingRuleAssignment } from "./parkingRuleAssignment.model";
import { duplicateDocument } from "../../utils/modelHelpers";
import { Context } from "../../db/gql";

import mongoose from "mongoose";
import lodash from "lodash";

export class CollisionError extends Error {
  collisions: IParkingRuleAssignment[] = null;
  constructor(message: string, collisions: IParkingRuleAssignment[]) {
    super(message);
    this.collisions = collisions;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, CollisionError.prototype);
  }
}

export const countCollisions = async (
  args: {
    id: string;
    input: IParkingRuleAssignment;
  },
  current: Partial<IParkingRuleAssignment>,
  ParkingRuleAssignment: mongoose.Model<IParkingRuleAssignment, {}>
): Promise<IParkingRuleAssignment[]> => {
  // If some of the collidable props are changed
  if (
    ["priority", "start", "end"].some(
      (field) => field in args.input && args.input[field] !== current[field]
    )
  ) {
    const newObj = { ...current, ...args.input };
    // Start <= End
    if (newObj.start.getTime() > newObj.end.getTime()) {
      throw new Error("start > end!");
    }
    // Filter out itself
    const idQuery = !!args.id ? { _id: { $ne: args.id } } : {};
    const collisions = await ParkingRuleAssignment.find({
      ...idQuery,
      priority: newObj.priority,
      start: { $lt: newObj.end }, // not equal because assignments can start when one ends
      end: { $gt: newObj.start },
    });
    return collisions;
  }
  return [];
};

export const createParkingRuleAssignmentCopies = async (
  filter: any,
  ParkingRuleAssignment: mongoose.Model<IParkingRuleAssignment>,
  start: Date,
  end: Date,
  deltaPlus: number,
  onCollisionFail: boolean,
  trim: boolean
) => {
  const source = await ParkingRuleAssignment.find({
    ...filter,
    start: { $lte: end },
    end: { $gte: start },
  });
  return Promise.all(
    source.map((assignment) => {
      const copy = duplicateDocument(assignment);
      if (trim) {
        copy.start = new Date(Math.max(copy.start.getTime(), start.getTime()));
        copy.end = new Date(Math.min(copy.end.getTime(), end.getTime()));
      }
      // Offset start and end
      copy.start = new Date(copy.start.getTime() + deltaPlus);
      copy.end = new Date(copy.end.getTime() + deltaPlus);

      return countCollisions(
        { id: "000000000000000000000000", input: copy },
        assignment,
        ParkingRuleAssignment
      ).then((collisions) => {
        if (collisions.length === 0) {
          return copy;
        } else if (onCollisionFail) {
          const colls = collisions;
          return new CollisionError("There are collisions.", colls);
        } else {
          return null;
        }
      });
    })
  );
};

const generateDeltaPlus = ({ start, end, targetStarts, options }) => {
  let generator = null;
  // `options.mode` is a required argument
  if (options.mode === "REPEAT") {
    generator = function*() {
      const targetStart = targetStarts[0];
      const repeat = lodash.get(options, "repeat", 1);
      const length = end.getTime() - start.getTime();
      for (let i = 0; i < repeat; i++) {
        yield targetStart.getTime() - start.getTime() + i * length;
      }
    };
  } else {
    // mode === "MULTI"
    generator = function*() {
      for (const targetStart of targetStarts) {
        yield targetStart.getTime() - start.getTime();
      }
    };
  }
  return {
    [Symbol.iterator]: generator,
  };
};

// Returns two arrays. The first one contains the specified copies
// and the other one contains any collisions that may have occured.
export const checkCollisionsWhenDuplicating = async (
  args,
  ctx: Context
): Promise<[IParkingRuleAssignment[][], IParkingRuleAssignment[][]]> => {
  const { start, end, options } = args;
  const onCollisionFail = true;
  const trim = lodash.get(options, "trim", true);
  const filter = lodash.get(options, "filter", {});
  // Arrays that will be returned
  const assignmentCopies = [];
  const collisions = [];

  for (const deltaPlus of generateDeltaPlus(args)) {
    const copies = await createParkingRuleAssignmentCopies(
      filter,
      ctx.models.ParkingRuleAssignment,
      start,
      end,
      deltaPlus,
      onCollisionFail,
      trim
    );

    const newAssignmentCopies = [];
    for (const copy of copies) {
      if (copy instanceof CollisionError) {
        collisions.push(copy.collisions);
      } else {
        newAssignmentCopies.push(copy);
      }
    }
    assignmentCopies.push(newAssignmentCopies);
  }
  return [assignmentCopies, collisions];
};
