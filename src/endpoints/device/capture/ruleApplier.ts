import { AppliedRuleAssignment } from "./types";
import {
  IParkingRule,
  ParkingRule,
  ParkingRounding,
  ParkingTimeUnit
} from "../../../types/parking/parkingRule.model";

const getRequiredRules = async (
  ruleAssignments: AppliedRuleAssignment[]
): Promise<{
  [id: string]: any;
}> => {
  const requiredRules: {
    [id: string]: IParkingRule;
  } = {};
  (await ParkingRule.find({
    _id: { $in: ruleAssignments.map(rA => rA.assignment.rules).flat() }
  })).map(rule => (requiredRules[rule.id.toString()] = rule));
  return requiredRules;
};

const ceilFloorRound = (x: number, method: ParkingRounding): number => {
  switch (method) {
    case ParkingRounding.CEIL:
      return Math.ceil(x);
    case ParkingRounding.FLOOR:
      return Math.floor(x);
    case ParkingRounding.ROUND:
    default:
      return Math.round(x);
  }
};

export const applyRules = async (
  appliedRules: AppliedRuleAssignment[]
): Promise<[any, any]> => {
  const result = { feeCents: 0 };
  const requiredRules = await getRequiredRules(appliedRules);
  const filledAppliedRules = [];
  for (let i = 0; i < appliedRules.length; i++) {
    const startingFeeCents = result.feeCents;
    const ruleApplication = appliedRules[i];
    const timeDelta =
      ruleApplication.end.getTime() - ruleApplication.start.getTime();
    const filledRules = [];
    let freeTimeInMinutes = 0;
    for (const ruleId of ruleApplication.assignment.rules) {
      const rule = requiredRules[ruleId];
      filledRules.push(rule.toObject());
      filledRules[filledRules.length - 1].id = rule.id;
      if (rule.__t === "ParkingRuleTimedFee") {
        const coeff = rule.unitTime === ParkingTimeUnit.HOUR ? 60 : 1;
        const divider =
          rule.unitTime === ParkingTimeUnit.MINUTE ? 1000 * 60 : 1000 * 3600;

        freeTimeInMinutes = rule.freeInUnitTime * coeff;

        const allUnits = ceilFloorRound(
          timeDelta / divider,
          rule.roundingMethod
        ); // For every started time unit (2.5h == 3h)
        const paidUnits = Math.max(allUnits - freeTimeInMinutes / coeff, 0);
        freeTimeInMinutes -= paidUnits * coeff;
        result.feeCents += rule.centsPerUnitTime * paidUnits;
      }
    }
    filledAppliedRules.push({
      start: ruleApplication.start,
      end: ruleApplication.end,
      feeCents: result.feeCents - startingFeeCents,
      rules: filledRules
    });
  }
  return [result, filledAppliedRules];
};
