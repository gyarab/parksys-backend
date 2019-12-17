import { Resolver } from "../../db/gql";
import {
  IParkingRule,
  IParkingRulePermitAccess,
  IParkingRuleTimedFee
} from "./parkingRule.model";

// helpers
const transformVehicleSelectorInput = (selectors, VehicleSelector) => {
  return selectors.map(selector => {
    const sel = new VehicleSelector(selector);
    const err = sel.validateSync();
    if (!!err) throw err;
    return sel;
  });
};

// Query
const rules: Resolver = async (_, __, ctx) => {
  return await ctx.models.ParkingRule.find({});
};

// Mutation
const createParkingRulePermitAccess: Resolver = async (_, args, ctx) => {
  if (args.input.vehicles) {
    args.input.vehicles = transformVehicleSelectorInput(
      args.input.vehicles,
      ctx.models.VehicleSelector
    );
  }
  return await new ctx.models.ParkingRulePermitAccess(args.input).save();
};

const updateParkingRulePermitAccess: Resolver = async (_, args, ctx) => {
  if (args.input.vehicles) {
    args.input.vehicles = transformVehicleSelectorInput(
      args.input.vehicles,
      ctx.models.VehicleSelector
    );
  }
  return await ctx.models.ParkingRulePermitAccess.findByIdAndUpdate(
    args.id,
    args.input
  );
};

// ParkingRuleTimedFee

// ParkingRulePermitAccess

export default {
  Query: {
    rules
  },
  ParkingRule: {
    __resolveType(
      parkingRule: IParkingRulePermitAccess | IParkingRuleTimedFee
    ) {
      return parkingRule.__t;
    }
  },
  Mutation: {
    createParkingRulePermitAccess,
    updateParkingRulePermitAccess
  }
};
