import mongoose from "mongoose";
import { IParkingRule, ParkingRuleLabel } from "./parkingRule.model";
import {
  VehicleSelectorSchema,
  IVehicleSelector
} from "./vehicleSelector.model";

export interface IParkingRuleAssignment extends mongoose.Document {
  rules: Array<IParkingRule["_id"] | IParkingRule>;
  // Always local
  start: Date;
  end: Date;
  priority: number;
  vehicleSelectors: Array<IVehicleSelector["_id"] | IVehicleSelector>;
}
export const ParkingRuleAssignmentLabel = "ParkingRuleAssignment";

// Schema definition
export const ParkingRuleAssignmentSchema = new mongoose.Schema({
  rules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: ParkingRuleLabel
    }
  ],
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  priority: {
    type: Number,
    required: true
  },
  vehicleSelectors: [VehicleSelectorSchema]
});

// Schema Creation
export const ParkingRuleAssignment = mongoose.model<IParkingRuleAssignment>(
  ParkingRuleAssignmentLabel,
  ParkingRuleAssignmentSchema
);
