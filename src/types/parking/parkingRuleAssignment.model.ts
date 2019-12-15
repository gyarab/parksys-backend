import mongoose from "mongoose";
import { IParkingRule, ParkingRuleLabel } from "./parkingRule.model";
import { TimeSchema, Time } from "../../types/time/time.model";

export interface IParkingRuleAssignment extends mongoose.Document {
  rule: IParkingRule["_id"];
  // Always local
  start: Time;
  end: Time;
  duration: Number;
}
export const ParkingRuleAssignmentLabel = "ParkingRuleAssignment";

// Schema definition
export const ParkingRuleAssignmentSchema = new mongoose.Schema({
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: ParkingRuleLabel,
    required: true
  },
  start: TimeSchema(true, true, "start"),
  end: TimeSchema(true, true, "end")
});

// Schema Creation
export const ParkingRuleAssignment = mongoose.model<IParkingRuleAssignment>(
  ParkingRuleAssignmentLabel,
  ParkingRuleAssignmentSchema
);
