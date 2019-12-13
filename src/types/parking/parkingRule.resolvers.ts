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

// ParkingRule - common for all
const vehicles: Resolver = async (
  parkingRule: IParkingRule,
  _,
  ctx
): Promise<Array<any>> => {
  const populatedParkingRule: IParkingRule = await ctx.models.ParkingRule.populate(
    parkingRule,
    { path: "vehicles.filter" }
  );
  const selectors = populatedParkingRule.vehicles.map(selector => {
    if (selector.filter) {
      return selector.filter;
    } else {
      return { value: selector.singleton };
    }
  });
  return selectors;
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
  },
  Mutation: {
    createParkingRulePermitAccess,
    updateParkingRulePermitAccess
  }
};
