import mongoose from "mongoose";
import {
  IParkingRule,
  ParkingRuleSchema,
  ParkingRuleLabel
} from "./parkingRule.model";
import { TimeSchema, Time } from "../../types/time/time.model";
import {
  VehicleSelectorSchema,
  IVehicleSelector
} from "./vehicleSelector.model";

export interface IParkingRuleAssignment extends mongoose.Document {
  rules: Array<IParkingRule["_id"] | IParkingRule>;
  // Always local
  start: Time;
  end: Time;
  priority: number;
  vehicleSelectors: Array<IVehicleSelector["_id"] | IVehicleSelector>;
}
export const ParkingRuleAssignmentLabel = "ParkingRuleAssignment";

// Schema definition
export const ParkingRuleAssignmentSchema = new mongoose.Schema(
  {
    rules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: ParkingRuleLabel
      }
    ],
    start: TimeSchema(true, true, "start"),
    end: TimeSchema(true, true, "end"),
    priority: {
      type: Number,
      required: true
    },
    vehicleSelectors: [VehicleSelectorSchema]
  },
  { _id: false, id: false }
);

// Schema Creation
export const ParkingRuleAssignment = mongoose.model<IParkingRuleAssignment>(
  ParkingRuleAssignmentLabel,
  ParkingRuleAssignmentSchema
);
