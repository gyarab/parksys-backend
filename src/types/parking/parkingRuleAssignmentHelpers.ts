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
export type ParkingRuleAssignmentCreator = () => Promise<
  IParkingRuleAssignment
>;

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

export const createParkingRuleAssignmentCopies = (
  filter: any,
  ParkingRuleAssignment: mongoose.Model<IParkingRuleAssignment>,
  start: Date,
  end: Date,
  difference: number,
  onCollisionFail: boolean,
  trim: boolean
) => {
  return ParkingRuleAssignment.find({
    ...filter,
    start: { $lte: end },
    end: { $gte: start },
  }).then((source) => {
    return Promise.all(
      source.map((assignment) => {
        const copy = duplicateDocument(assignment);
        if (trim) {
          copy.start = new Date(
            Math.max(copy.start.getTime(), start.getTime())
          );
          copy.end = new Date(Math.min(copy.end.getTime(), end.getTime()));
        }
        // Offset start and end
        copy.start = new Date(copy.start.getTime() + difference);
        copy.end = new Date(copy.end.getTime() + difference);

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
  });
};

export const checkCollisionsWhenDuplicating = async (
  { start, end, targetStarts, options },
  ctx: Context
): Promise<[ParkingRuleAssignmentCreator[], IParkingRuleAssignment[][]]> => {
  const onCollisionFail = true;
  const trim = lodash.get(options, "trim", true);
  const filter = lodash.get(options, "filter", {});
  // Arrays that will be returned
  const assignmentCreators = [];
  const collisions = [];

  const addToResult = (assignment) => {
    assignmentCreators.push(() =>
      ctx.models.ParkingRuleAssignment.create(assignment)
    );
  };

  // `options.mode` is a required argument
  if (options.mode === "REPEAT") {
    const targetStart = targetStarts[0];
    const repeat = lodash.get(options, "repeat", 1);
    const diff = end.getTime() - start.getTime();
    for (let i = 0; i < repeat; i++) {
      const difference = targetStart.getTime() - start.getTime() + i * diff;
      const result = await createParkingRuleAssignmentCopies(
        filter,
        ctx.models.ParkingRuleAssignment,
        start,
        end,
        difference,
        onCollisionFail,
        trim
      );
      result.forEach((res) => {
        if (res instanceof CollisionError) {
          collisions.push(res.collisions);
        }
      });
      if (collisions.length > 0) {
        break;
      } else {
        addToResult(result);
      }
    }
  } else {
    // MULTI
    for (const targetStart of targetStarts) {
      const difference = targetStart.getTime() - start.getTime();
      const result = await createParkingRuleAssignmentCopies(
        filter,
        ctx.models.ParkingRuleAssignment,
        start,
        end,
        difference,
        onCollisionFail,
        trim
      );
      result.forEach((res) => {
        if (res instanceof CollisionError) {
          collisions.push(res.collisions);
        }
      });
      if (collisions.length > 0) {
        break;
      } else {
        addToResult(result);
      }
    }
  }
  return [assignmentCreators, collisions];
};
