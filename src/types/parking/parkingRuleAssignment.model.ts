import mongoose from "mongoose";
import { IParkingRule, ParkingRuleLabel } from "./parkingRule.model";
import { IVehicleFilter, VehicleFilterLabel } from "./vehicleFilter.model";

export enum VehicleFilterMode {
  ALL = "ALL",
  NONE = "NONE"
}

export interface IParkingRuleAssignment extends mongoose.Document {
  rules: Array<IParkingRule["_id"] | IParkingRule>;
  // Always local
  start: Date;
  end: Date;
  priority: number;
  vehicleFilterMode: VehicleFilterMode;
  vehicleFilters: Array<IVehicleFilter["_id"]> | Array<IVehicleFilter>;
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
  vehicleFilterMode: {
    type: String,
    enum: Object.keys(VehicleFilterMode),
    required: true
  },
  vehicleFilters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: VehicleFilterLabel
    }
  ]
});

// Schema Creation
export const ParkingRuleAssignment = mongoose.model<IParkingRuleAssignment>(
  ParkingRuleAssignmentLabel,
  ParkingRuleAssignmentSchema
);
