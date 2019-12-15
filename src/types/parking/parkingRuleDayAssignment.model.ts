import mongoose from "mongoose";
import {
  IParkingRuleAssignmentGroup,
  ParkingRuleAssignmentGroupLabel
} from "./parkingRuleAssignmentGroup.model";

// Interfaces
export interface IParkingRuleDayAssignment extends mongoose.Document {
  day: Date;
  groups: IParkingRuleAssignmentGroup["_id"][] | IParkingRuleAssignmentGroup[];
}

export const ParkingRuleDayAssignmentLabel = "ParkingRuleDayAssignment";

// Schema definition
export const ParkingRuleDayAssignmentSchema = new mongoose.Schema({
  day: {
    type: Date,
    required: true,
    // No internet help with this feature
    // unique: true,
    // dropDups: true,
    // Remove hours and smaller
    set: (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: ParkingRuleAssignmentGroupLabel
    }
  ]
});

// Schema Creation
export const ParkingRuleDayAssignment = mongoose.model<
  IParkingRuleDayAssignment
>(ParkingRuleDayAssignmentLabel, ParkingRuleDayAssignmentSchema);
