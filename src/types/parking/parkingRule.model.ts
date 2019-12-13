import mongoose from "mongoose";
import {
  VehicleFilterLabel,
  VehicleSelectorEnum,
  IVehicleFilter
} from "./vehicleFilter.model";
import { Money, MoneySchema } from "../money/money.model";
import { ValidationError } from "apollo-server-core";

interface VehicleFilterPlaceholder {
  // Either one of these
  filter?: IVehicleFilter["_id"];
  singleton?: VehicleSelectorEnum;
}
export interface IParkingRule extends mongoose.Document {
  name: string;
  vehicles: VehicleFilterPlaceholder[];
}
const VehicleSelectorSchema = new mongoose.Schema(
  {
    // Either one of these, both are not allowed
    filter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: VehicleFilterLabel,
      required: function() {
        return !this.singleton;
      },
      validate: {
        validator: function() {
          return !this.singleton && !!this.filter;
        }
      }
    },
    singleton: {
      type: String,
      enum: Object.keys(VehicleSelectorEnum),
      required: function() {
        return !this.filter;
      },
      validate: {
        validator: function() {
          return !this.filter && !!this.singleton;
        }
      }
    }
  },
  { _id: false, id: false }
);
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
