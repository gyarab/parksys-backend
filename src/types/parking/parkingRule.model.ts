import mongoose from "mongoose";
import { Money, MoneySchema } from "../money/money.model";

export interface IParkingRule extends mongoose.Document {
  name: string;
}

export const ParkingRuleLabel = "ParkingRule";
export const ParkingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  }
});

export const ParkingRule = mongoose.model<IParkingRule>(
  ParkingRuleLabel,
  ParkingRuleSchema
);

export enum ParkingTimeUnit {
  MINUTE = "MINUTE",
  HOUR = "HOUR"
}

export enum ParkingRounding {
  CEIL = "CEIL",
  FLOOR = "FLOOR",
  ROUND = "ROUND"
}

// Implementations
export interface IParkingRuleTimedFee extends IParkingRule {
  __t: string;
  centsPerUnitTime: Money;
  unitTime: ParkingTimeUnit;
  freeInUnitTime: number;
  roundingMethod: ParkingRounding;
}
export const ParkingRuleTimedFeeLabel = "ParkingRuleTimedFee";
export const ParkingRuleTimedFeeSchema = new mongoose.Schema({
  centsPerUnitTime: { ...MoneySchema, required: true },
  unitTime: {
    type: String,
    required: true,
    enum: Object.keys(ParkingTimeUnit)
  },
  freeInUnitTime: {
    type: Number,
    required: true,
    default: 0
  },
  roundingMethod: {
    type: String,
    required: true,
    enum: Object.keys(ParkingRounding),
    default: ParkingRounding.ROUND
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
