import {
  IParkingRuleAssignment,
  ParkingRuleAssignment
} from "../../../types/parking/parkingRuleAssignment.model";
import { IVehicle } from "../../../types/vehicle/vehicle.model";
import { LinearHeap, BinaryHeap } from "../../../utils/heap";
import { createFilterApplier } from "./filterApplier";
import {
  AppliedRuleAssignment,
  RuleEventEnum,
  RuleEvent,
  MillisMemo
} from "./types";

const getAppliedRuleAssignments = (
  start: Date,
  end: Date,
  ruleAssignments: IParkingRuleAssignment[],
  vehicle: IVehicle
) => {
  const [events, millisMemo] = transformRuleAssignmentsIntoRuleEvents(
    ruleAssignments,
    start,
    end
  );
  // Stores indexes and orders them according to the values
  // under indices in group.ruleAssignments
  const heap = new BinaryHeap<number>(
    (i, j) =>
      // Priority by ParkingRuleAssignment's priority
      ruleAssignments[i].priority - ruleAssignments[j].priority
  );
  let currentRuleAssignmentI = -1; // index, -1 => no rule is being used
  let currentRuleAssignmentFrom: number = null; // in minutes from midnight
  // Result for this group
  const appliedRuleAssignments: Array<AppliedRuleAssignment> = [];
  const addAppliedRuleAssignment = (ara: AppliedRuleAssignment) => {
    if (ara.start.getTime() < ara.end.getTime()) {
      appliedRuleAssignments.push(ara);
    }
  };
  const ruleAppliesToVehicle = createFilterApplier(vehicle);
  for (let i = 0; i < events.length; i++) {
    // index - into group.ruleAssignments, se - START/END
    const [index, se] = events[i];
    const ruleAssignment: IParkingRuleAssignment = ruleAssignments[index];
    const currentRuleAssignment: IParkingRuleAssignment =
      ruleAssignments[currentRuleAssignmentI];
    const eventMillis = millisMemo[index][se];
    // Time in minutes of the current event
    if (se === RuleEventEnum.START) {
      // No current rule assignment AND next one applies
      if (
        currentRuleAssignmentI === -1 &&
        ruleAppliesToVehicle(ruleAssignment)
      ) {
        // Use next rule
        currentRuleAssignmentI = index;
        currentRuleAssignmentFrom = eventMillis;
      }
      // Using a rule assignment AND next rule assignment has higher priority
      else if (
        currentRuleAssignmentI !== -1 &&
        currentRuleAssignment.priority < ruleAssignment.priority &&
        ruleAppliesToVehicle(ruleAssignment)
      ) {
        // Apply
        addAppliedRuleAssignment({
          start: new Date(currentRuleAssignmentFrom),
          end: new Date(eventMillis),
          assignment: currentRuleAssignment
        });
        // Stash if current rule assignment may be used in future
        if (
          millisMemo[index][RuleEventEnum.END] <
          millisMemo[currentRuleAssignmentI][RuleEventEnum.END]
        ) {
          heap.add(currentRuleAssignmentI);
        }
        // Use next rule
        currentRuleAssignmentI = index;
        currentRuleAssignmentFrom = eventMillis;
      }
      // Next rule assignment has lower priority.
      // Since checking whether it applies to the vehicle is potentially expensive (N*M),
      // we put it in the heap and check whether it applies when it is truly needed.
      else if (
        currentRuleAssignmentI !== -1 &&
        currentRuleAssignment.priority > ruleAssignment.priority &&
        // Stash if it can be used in future after this rule assignment
        millisMemo[index][RuleEventEnum.END] >
          millisMemo[currentRuleAssignmentI][RuleEventEnum.END]
      ) {
        heap.add(index);
      }
    } else if (se === RuleEventEnum.END) {
      if (currentRuleAssignmentI !== -1 && currentRuleAssignmentI === index) {
        // End current rule assignments by adding it into an array with correct time
        // Apply
        addAppliedRuleAssignment({
          start: new Date(currentRuleAssignmentFrom),
          end: new Date(eventMillis),
          assignment: currentRuleAssignment
        });
        // Get rule assignment from the heap
        let nextRuleAssignmentI = heap.pop();
        const canBeUsed = (j: number) =>
          millisMemo[j][RuleEventEnum.END] > eventMillis &&
          ruleAppliesToVehicle(ruleAssignments[j]);
        while (heap.size() && !canBeUsed(nextRuleAssignmentI)) {
          nextRuleAssignmentI = heap.pop();
        }
        if (nextRuleAssignmentI !== null && canBeUsed(nextRuleAssignmentI)) {
          // Use next rule
          currentRuleAssignmentI = nextRuleAssignmentI;
          currentRuleAssignmentFrom = eventMillis;
        } else {
          // No rule is being used
          currentRuleAssignmentI = -1;
          currentRuleAssignmentFrom = null;
        }
      }
    }
  }
  return appliedRuleAssignments;
};

const transformRuleAssignmentsIntoRuleEvents = (
  ruleAssignments: IParkingRuleAssignment[],
  start: Date,
  end: Date
): [Array<RuleEvent>, MillisMemo] => {
  const startMillis = start.getTime();
  const endMillis = end.getTime();
  const millisMemo: MillisMemo = [];
  const timePairs = ruleAssignments
    .map((assignment: IParkingRuleAssignment, i: number) => {
      let assignmentStartMillis = assignment.start.getTime();
      let assignmentEndMillis = assignment.end.getTime();
      if (
        (assignmentStartMillis < startMillis &&
          assignmentEndMillis < startMillis) ||
        (assignmentStartMillis > endMillis && assignmentEndMillis > endMillis)
      ) {
        return null;
      }

      if (assignmentStartMillis < startMillis) {
        assignmentStartMillis = startMillis;
      }
      if (endMillis < assignmentEndMillis) {
        assignmentEndMillis = endMillis;
      }
      millisMemo[i] = [assignmentStartMillis, assignmentEndMillis];
      return [[i, RuleEventEnum.START], [i, RuleEventEnum.END]];
    })
    // Filter after to preserve indexes from group.ruleAssignments
    .filter(assignment => !!assignment);
  const events = [].concat
    .apply([], timePairs)
    .sort((a: RuleEvent, b: RuleEvent) => {
      const diff = millisMemo[a[0]][a[1]] - millisMemo[b[0]][b[1]];
      // End times should go first
      if (diff === 0) return a[1] - b[1];
      return diff;
    });
  return [events, millisMemo];
};

export const findAppliedRules = async (
  vehicle: IVehicle,
  start: Date,
  end: Date
) => {
  if (start.getTime() >= end.getTime()) {
    return [];
  }
  // Fetch ParkingRuleDayAssignment
  const ruleAssignments = await ParkingRuleAssignment.find({
    start: { $lte: end },
    end: { $gte: start }
  }).populate({ path: "vehicleFilters" });
  // Result object
  const appliedRuleAssignments = getAppliedRuleAssignments(
    start,
    end,
    ruleAssignments,
    vehicle
  );
  return appliedRuleAssignments;
};
