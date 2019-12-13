import mongoose from "mongoose";
import { Money, MoneySchema } from "../money/money.model";
import {
  IVehicleSelector,
  VehicleSelectorSchema
} from "./vehicleSelector.model";

export interface IParkingRule extends mongoose.Document {
  name: string;
  vehicles: IVehicleSelector["_id"][];
}

export const ParkingRuleLabel = "ParkingRule";
export const ParkingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  },
  // If empty, no vehicles are selected.
  vehicles: [VehicleSelectorSchema]
});

export const ParkingRule = mongoose.model<IParkingRule>(
  ParkingRuleLabel,
  ParkingRuleSchema
);

export enum ParkingTimeUnit {
  MINUTE = "MINUTE",
  HOUR = "HOUR"
}

// Implementations
export interface IParkingRuleTimedFee extends IParkingRule {
  __t: string;
  centsPerUnitTime: Money;
  unitTime: ParkingTimeUnit;
}
export const ParkingRuleTimedFeeLabel = "ParkingRuleTimedFee";
export const ParkingRuleTimedFeeSchema = new mongoose.Schema({
  centsPerUnitTime: { ...MoneySchema, required: true },
  unitTime: {
    type: String,
    required: true,
    enum: Object.keys(ParkingTimeUnit)
  }
});
export const ParkingRuleTimedFee = ParkingRule.discriminator<
  IParkingRuleTimedFee
>(ParkingRuleTimedFeeLabel, ParkingRuleTimedFeeSchema);

export interface IParkingRulePermitAccess extends IParkingRule {
  __t: string;
  permit: boolean;
}
export const ParkingRulePermitAccessLabel = "ParkingRulePermitAccess";
export const ParkingRulePermitAccessSchema = new mongoose.Schema({
  permit: {
    type: Boolean,
    required: true
  }
});
export const ParkingRulePermitAccess = ParkingRule.discriminator<
  IParkingRulePermitAccess
>(ParkingRulePermitAccessLabel, ParkingRulePermitAccessSchema);
