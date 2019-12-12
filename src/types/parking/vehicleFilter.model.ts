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
  // Must be a tree
  inheritsFrom?: IVehicleFilter["_id"];
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
  inheritsFrom: {
    type: mongoose.Types.ObjectId,
    ref: VehicleFilterLabel
  },
  action: {
    type: String,
    enum: Object.keys(VehicleFilterAction)
  }
});

VehicleFilterSchema.pre("save", async function(this: IVehicleFilter) {
  const model = <mongoose.Model<IVehicleFilter, {}>>this.constructor;
  // Using population the database will be hit at most N / 2 times.
  // It may be the case that some of the subdocuments are already in memory.
  const getNextFilter = async (
    filter: IVehicleFilter
  ): Promise<IVehicleFilter> => {
    if (filter.populated("inheritsFrom")) {
      // Already fetched.
      return filter.inheritsFrom;
    } else {
      // Current filter.inheritsFrom is just a reference, not a document.
      return await model
        .findById(filter.inheritsFrom)
        .select("+_id +inheritsFrom")
        // Fetch the next 2 filters too.
        .populate({
          path: "inheritsFrom",
          select: {
            _id: 1,
            inheritsFrom: 1
          }
        });
    }
  };

  let currentFilter = this;
  const idSet = new Set([this.id.toString()]);
  while (!!currentFilter.inheritsFrom) {
    const nextFilter = await getNextFilter(currentFilter);
    const fid = nextFilter.id.toString();
    if (idSet.has(fid)) {
      throw new Error("Cyclic VehicleFilter dependency found");
    } else {
      idSet.add(fid);
      currentFilter = nextFilter;
    }
  }
});

export const VehicleFilter = mongoose.model<IVehicleFilter>(
  VehicleFilterLabel,
  VehicleFilterSchema
);
