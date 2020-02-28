import mongoose from "mongoose";
import { ICheck, Check, CheckSchema } from "./check.model";
import { IVehicle, VehicleLabel } from "../vehicle/vehicle.model";
import { IParkingRule, ParkingRuleLabel } from "../parking/parkingRule.model";
import { Money, MoneySchema } from "../money/money.model";

export interface IParkingSession extends mongoose.Document {
  active: Boolean;
  checkIn: ICheck;
  checkOut?: ICheck;
  vehicle: IVehicle["_id"];
  appliedRules?: Object[];
  finalFee: Money;
}
export const ParkingSessionLabel = "ParkingSession";
export const ParkingSessionSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  checkIn: {
    type: CheckSchema,
    required: true,
    default: () => new Check({})
  },
  checkOut: {
    type: CheckSchema,
    required: false
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: VehicleLabel,
    required: true,
    index: true
  },
  appliedRules: [
    {
      type: Object
    }
  ],
  finalFee: { ...MoneySchema }
});
export const ParkingSession = mongoose.model<IParkingSession>(
  ParkingSessionLabel,
  ParkingSessionSchema
);
