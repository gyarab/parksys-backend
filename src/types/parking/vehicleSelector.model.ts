import mongoose from "mongoose";
import {
  IVehicleFilter,
  VehicleSelectorEnum,
  VehicleFilterLabel
} from "./vehicleFilter.model";

export interface IVehicleSelector extends mongoose.Document {
  // Either one of these
  filter?: IVehicleFilter["_id"];
  singleton?: VehicleSelectorEnum;
}
export const VehicleSelectorLabel = "VehicleSelector";
export const VehicleSelectorSchema = new mongoose.Schema(
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
export const VehicleSelector = mongoose.model<IVehicleSelector>(
  VehicleSelectorLabel,
  VehicleSelectorSchema
);
