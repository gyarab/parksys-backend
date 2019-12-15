import mongoose from "mongoose";
import {
  ParkingRuleAssignmentLabel,
  IParkingRuleAssignment
} from "./parkingRuleAssignment.model";

// Interfaces
export interface IParkingRuleAssignmentGroup extends mongoose.Document {
  day: Date;
  ruleAssignments: IParkingRuleAssignment["_id"][];
}

export const ParkingRuleAssignmentGroupLabel = "ParkingRuleAssignmentGroup";

// Schema definition
export const ParkingRuleAssignmentGroupSchema = new mongoose.Schema({
  ruleAssignments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: ParkingRuleAssignmentLabel
    }
  ],
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  }
});

// Schema Creation
export const ParkingRuleAssignmentGroup = mongoose.model<
  IParkingRuleAssignmentGroup
>(ParkingRuleAssignmentGroupLabel, ParkingRuleAssignmentGroupSchema);
