import { AppliedRuleAssignment } from "./types";
import {
  ParkingRule,
  ParkingRounding,
  ParkingTimeUnit,
} from "../../../types/parking/parkingRule.model";

const getRequiredRules = async (
  ruleAssignments: AppliedRuleAssignment[]
): Promise<{
  [id: string]: any;
}> => {
  const rules = await ParkingRule.find({
    _id: { $in: ruleAssignments.map((rA) => rA.assignment.rules).flat() },
  });
  return rules.reduce((requiredRules, rule) => {
    requiredRules[rule.id.toString()] = rule;
    return requiredRules;
  }, {});
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

const applyRuleApplication = (ruleApplication, requiredRules, result) => {
  const startingFeeCents = result.feeCents;
  const timeDelta =
    ruleApplication.end.getTime() - ruleApplication.start.getTime();
  // Resolve each rule of the rule application
  const filledRules = ruleApplication.assignment.rules.map((ruleId) => {
    const rule = requiredRules[ruleId];
    if (rule.__t === "ParkingRuleTimedFee") {
      const divider =
        rule.unitTime === ParkingTimeUnit.MINUTE ? 1000 * 60 : 1000 * 3600;

      const allUnits = ceilFloorRound(timeDelta / divider, rule.roundingMethod); // For every started time unit (2.5h == 3h)
      const paidUnits = Math.max(allUnits - rule.freeInUnitTime, 0);
      result.feeCents += rule.centsPerUnitTime * paidUnits;
    }
    const filledRule = rule.toObject();
    filledRule.id = rule.id;
    return filledRule;
  });
  return {
    start: ruleApplication.start,
    end: ruleApplication.end,
    feeCents: result.feeCents - startingFeeCents,
    rules: filledRules,
  };
};

export const applyRules = async (
  appliedRules: AppliedRuleAssignment[]
): Promise<[any, any]> => {
  const result = { feeCents: 0 };
  const requiredRules = await getRequiredRules(appliedRules);
  // The applied rules and their start and end
  const filledAppliedRules = appliedRules.map((ruleApplication) =>
    // `requiredRules` serves as cache, `result` accumulates fee
    applyRuleApplication(ruleApplication, requiredRules, result)
  );
  return [result, filledAppliedRules];
};
