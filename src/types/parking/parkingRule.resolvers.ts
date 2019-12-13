import { Resolver } from "../../db/gql";
import {
  IParkingRule,
  IParkingRulePermitAccess,
  IParkingRuleTimedFee
} from "./parkingRule.model";
import { IVehicleSelector } from "./vehicleSelector.model";

// Query
const rules: Resolver = async (_, __, ctx) => {
  return await ctx.models.ParkingRule.find({});
};

// ParkingRule - common for all
const vehicles: Resolver = async (
  parkingRule: IParkingRule,
  _,
  ctx
): Promise<IVehicleSelector[]> => {
  const populatedParkingRule: IParkingRule = await ctx.models.ParkingRule.populate(
    parkingRule,
    {
      path: "vehicles.filter"
    }
  );
  return populatedParkingRule.vehicles;
};

// ParkingRuleTimedFee

// ParkingRulePermitAccess

export default {
  Query: {
    rules
  },
  ParkingRuleTimedFee: {
    vehicles
  },
  ParkingRulePermitAccess: {
    vehicles
  },
  ParkingRule: {
    __resolveType(
      parkingRule: IParkingRulePermitAccess | IParkingRuleTimedFee
    ) {
      return parkingRule.__t;
    }
  }
};
