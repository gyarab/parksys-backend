import { IParkingRuleAssignment } from "../../../types/parking/parkingRuleAssignment.model";

export type AppliedRuleAssignment = {
  start: Date;
  end: Date;
  assignment: IParkingRuleAssignment;
};

export enum RuleEventEnum {
  START = 0,
  END = 1
}

// [Index, Start/End]
export type RuleEvent = [number, RuleEventEnum];
export type MillisMemo = Array<[number, number]>;
