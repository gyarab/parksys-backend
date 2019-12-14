import mongoose from "mongoose";
import { MoneySchema, Money } from "../money/money.model";

export interface IVehicle extends mongoose.Document {
  licensePlate: string;
  totalPaid: Money;
}
export const VehicleLabel = "Vehicle";
export const VehicleSchema = new mongoose.Schema({
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    index: true // Most lookups are done via licensePlate
  },
  totalPaidCents: { ...MoneySchema }
});
export const Vehicle = mongoose.model<IVehicle>(VehicleLabel, VehicleSchema);
