import { Resolver } from "../../db/gql";
import {
  IParkingRulePermitAccess,
  IParkingRuleTimedFee
} from "./parkingRule.model";

// Query
const rules: Resolver = async (_, __, ctx) => {
  return await ctx.models.ParkingRule.find({});
};

// Mutation
const createParkingRulePermitAccess: Resolver = async (_, args, ctx) => {
  return await new ctx.models.ParkingRulePermitAccess(args.input).save();
};

const updateParkingRulePermitAccess: Resolver = async (_, args, ctx) => {
  return await ctx.models.ParkingRulePermitAccess.findByIdAndUpdate(
    args.id,
    args.input,
    { new: true }
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
