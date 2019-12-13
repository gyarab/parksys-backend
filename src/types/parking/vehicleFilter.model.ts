import mongoose from "mongoose";
import { VehicleLabel, IVehicle } from "../vehicle/vehicle.model";

export enum VehicleSelectorEnum {
  ALL = "ALL",
  NONE = "NONE"
}

export enum VehicleFilterAction {
  EXCLUDE = "EXCLUDE",
  INCLUDE = "INCLUDE"
}

export interface IVehicleFilter extends mongoose.Document {
  name: string;
  vehicles: IVehicle["_id"][];
  action: VehicleFilterAction;
}
export const VehicleFilterLabel = "VehicleFilter";
export const VehicleFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  },
  vehicles: [
    {
      type: mongoose.Types.ObjectId,
      ref: VehicleLabel
    }
  ],
  action: {
    type: String,
    enum: Object.keys(VehicleFilterAction)
  }
});

export const VehicleFilter = mongoose.model<IVehicleFilter>(
  VehicleFilterLabel,
  VehicleFilterSchema
);
