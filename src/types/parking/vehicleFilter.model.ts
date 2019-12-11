import mongoose from "mongoose";
import { VehicleLabel, IVehicle } from "../vehicle/vehicle.model";

export enum VehicleSelectorEnum {
  ALL = "ALL",
  NONE = "NONE"
}

export interface IVehicleFilter extends mongoose.Document {
  vehicles: IVehicle["_id"][];
  // Must be a tree
  inheritsFrom?: IVehicleFilter["_id"][];
}
export const VehicleFilterLabel = "VehicleFilter";
export const VehicleFilterSchema = new mongoose.Schema({
  vehicles: [
    {
      type: mongoose.Types.ObjectId,
      ref: VehicleLabel
    }
  ],
  inheritsFrom: [
    {
      type: mongoose.Types.ObjectId,
      ref: VehicleFilterLabel
    }
  ]
});

export const VehicleFilter = mongoose.model<IVehicleFilter>(
  VehicleFilterLabel,
  VehicleFilterSchema
);
