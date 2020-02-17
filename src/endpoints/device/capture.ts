import sharp from "sharp";
import tmp from "tmp";
import crypto from "crypto";
import { AsyncHandler } from "../../app";
import lpr from "../../apis/lpr";
import { Device, IDevice } from "../../types/device/device.model";
import { LicensePlateRecognitionResult } from "../../apis/lpr/types";
import { Vehicle, IVehicle } from "../../types/vehicle/vehicle.model";
import { Check } from "../../types/parking/check.model";
import {
  ParkingSession,
  IParkingSession
} from "../../types/parking/parkingSession.model";
import { LinearHeap } from "../../utils/heap";
import {
  IParkingRuleAssignment,
  ParkingRuleAssignment,
  VehicleFilterMode
} from "../../types/parking/parkingRuleAssignment.model";
import { VehicleFilterAction } from "../../types/parking/vehicleFilter.model";
import {
  ParkingTimeUnit,
  ParkingRule,
  IParkingRule
} from "../../types/parking/parkingRule.model";

const getLprResult = (file: any): Promise<LicensePlateRecognitionResult> => {
  return new Promise<LicensePlateRecognitionResult>((resolve, reject) => {
    tmp.file((err, fname, fd, removeTmpFile) => {
      if (err) reject(err);
      // TODO: Parametrize this using config
      sharp(file.data)
        .resize(1000, 1000)
        .toFile(fname)
        .then(_ => {
          lpr
            .recognizeLicensePlate(fname)
            .then(result => {
              removeTmpFile();
              resolve(result);
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  });
};

export const createFilterApplier = (vehicle: IVehicle) => {
  const vId = vehicle._id.toString();
  // Cache answers
  const cache: { [id: string]: boolean } = {};
  return (ruleAssignment: IParkingRuleAssignment): boolean => {
    const rId = ruleAssignment._id.toString();
    if (cache[rId] !== undefined) {
      // Return already calculated answers
      return cache[rId];
    }
    if (!ruleAssignment.active) {
      return false;
    }
    const all = ruleAssignment.vehicleFilterMode === VehicleFilterMode.ALL;
    const none = !all;
    // Assumes ruleAssignment is populated
    const idSet = new Set<string>();
    for (const filter of ruleAssignment.vehicleFilters) {
      const include = filter.action === VehicleFilterAction.INCLUDE;
      const exclude = !include;
      if ((all && exclude) || (none && include)) {
        // Add to set
        for (const id of filter.vehicles) {
          idSet.add(id.toString());
        }
      } else {
        // Remove from set
        for (const id of filter.vehicles) {
          idSet.delete(id.toString());
        }
      }
    }
    // This could be substituted with an XOR operation but that would be unreadable
    if (all) {
      // Exclusion mode
      cache[rId] = !idSet.has(vId);
    } else {
      // Inclusion mode
      cache[rId] = idSet.has(vId);
    }
    return cache[rId];
  };
};

enum RuleEventEnum {
  START = 0,
  END = 1
}

// [Index, Start/End]
type RuleEvent = [number, RuleEventEnum];
type MillisMemo = Array<[number, number]>;

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

type AppliedRuleAssignment = {
  start: Date;
  end: Date;
  assignment: IParkingRuleAssignment;
};

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
  const heap = new LinearHeap<number>(
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
        let nextRuleAssignmentI = heap.extractTop();
        const canBeUsed = (j: number) =>
          millisMemo[j][RuleEventEnum.END] > eventMillis &&
          ruleAppliesToVehicle(ruleAssignments[j]);
        while (heap.size() && !canBeUsed(nextRuleAssignmentI)) {
          nextRuleAssignmentI = heap.extractTop();
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

export const handleResult = async (
  { best, candidates, coordinates, rectangle }: LicensePlateRecognitionResult,
  device: IDevice,
  captureTime: Date
) => {
  // console.log(new Date(), best, candidates);
  // No result
  console.log(best);
  if (!best) return;
  // TODO: This part may need some heuristic using past images to determine the actual license plate
  // Find Vehicle or create it
  const vehicle =
    (await Vehicle.findOne({ licensePlate: best.plate })) ||
    (await new Vehicle({ licensePlate: best.plate }).save());
  // console.log(vehicle);
  // Find or create ParkingSession
  const check = new Check({ byDevice: device, time: captureTime });
  let parkingSession: IParkingSession = await ParkingSession.findOne({
    vehicle,
    active: true
  });
  // TODO: Branch based on device type (entry/exit)
  if (!!parkingSession) {
    // The vehicle is exiting
    const appliedRules = await findAppliedRules(
      vehicle,
      parkingSession.checkIn.time,
      captureTime
    );
    const result = { feeCents: 0 };
    const requiredRules = await getRequiredRules(appliedRules);

    for (const ruleApplication of appliedRules) {
      const timeDelta =
        ruleApplication.end.getTime() - ruleApplication.start.getTime();
      for (const ruleId of ruleApplication.assignment.rules) {
        const rule = requiredRules[ruleId];
        if (rule.__t === "ParkingRuleTimedFee") {
          const divider =
            rule.unitTime === ParkingTimeUnit.MINUTE ? 1000 * 60 : 1000 * 3600;
          // TODO: Make this configurable?
          const units = Math.ceil(timeDelta / divider); // For every started time unit (2.5h == 3h)
          result.feeCents += rule.centsPerUnitTime * units;
        }
      }
    }
    parkingSession.finalFee = result.feeCents;
    parkingSession.checkOut = check;
    parkingSession.active = false;
    await parkingSession.save();
  } else {
    // The vehicle is entering
    parkingSession = await new ParkingSession({
      vehicle,
      checkIn: check
    }).save();
  }
};

export const filenameToDate = (filename: string): Date => {
  const timestamp = Number.parseInt(filename.split("_")[1].split(".")[0]);
  return new Date(timestamp);
};

const capture: AsyncHandler<any> = async (req, res, next) => {
  // Send back device config if updated
  const id = crypto.randomBytes(4).toString("hex");
  // console.log(id, "READ", new Date());
  const device = await Device.findById(req.token.device.id);
  if (!device) {
    res.status(400).end();
    return next();
  }

  if (device.shouldSendConfig) {
    res.send({
      data: { config: device.config }
    });
    device.shouldSendConfig = false;
    await device.save();
  } else {
    res.send({});
  }

  // Process
  if (req.files == null) return next();
  const files = req.files;

  try {
    const filename = Object.keys(files)[0];
    const captureTime = filenameToDate(filename);
    // TODO: Cache K results and average over them
    const result = await getLprResult(files[filename]);
    // console.log(id, "RSLT", new Date(), result);
    await handleResult(result, device, captureTime);
    return next();
  } catch (err) {
    return next(err);
  }
};

export default capture;
