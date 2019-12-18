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
import moment from "moment";
import {
  ParkingRuleDayAssignment,
  IParkingRuleDayAssignment
} from "../../types/parking/parkingRuleDayAssignment.model";
import { LinearHeap } from "../../utils/heap";
import { IParkingRuleAssignment } from "../../types/parking/parkingRuleAssignment.model";
import { Time } from "../../types/time/time.model";
import { IParkingRuleAssignmentGroup } from "../../types/parking/parkingRuleAssignmentGroup.model";
import { IVehicleSelector } from "../../types/parking/vehicleSelector.model";

const getLprResult = (file: any): Promise<LicensePlateRecognitionResult> => {
  return new Promise<LicensePlateRecognitionResult>((resolve, reject) => {
    tmp.file((err, fname, fd, removeTmpFile) => {
      if (err) reject(err);

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

const getMinutes = (t: Time) => {
  return t.hours * 60 + t.minutes;
};

const ruleAppliesToVehicle = (
  selectors: IVehicleSelector[],
  vehicleId: IVehicle["_id"]
): boolean => {
  return true;
};

enum RuleEventEnum {
  START = 0,
  END = 1
}

// [Index, Start/End]
type RuleEvent = [number, RuleEventEnum];
type MinutesMemo = Array<[number, number]>;

const transformRuleAssignmentsIntoRuleEvents = (
  group: IParkingRuleAssignmentGroup,
  start: Time,
  end: Time
): [Array<RuleEvent>, MinutesMemo] => {
  const startMinutes = getMinutes(start);
  const endMinutes = getMinutes(end);
  const minutesMemo: MinutesMemo = [];
  const timePairs = group.ruleAssignments
    .map((assignment: IParkingRuleAssignment, i: number) => {
      let assignmentStart = getMinutes(assignment.start);
      let assignmentEnd = getMinutes(assignment.end);
      if (
        (assignmentStart < startMinutes && assignmentEnd < startMinutes) ||
        (assignmentStart > endMinutes && assignmentEnd > endMinutes)
      ) {
        return null;
      }
      if (assignmentStart < startMinutes) assignmentStart = startMinutes;
      if (endMinutes < assignmentEnd) assignmentEnd = endMinutes;
      minutesMemo[i] = [assignmentStart, assignmentEnd];
      return [
        [i, RuleEventEnum.START, assignmentStart],
        [i, RuleEventEnum.END, assignmentEnd]
      ];
    })
    // Filter after to preserve indexes from group.ruleAssignments
    .filter(assignment => !!assignment);
  const events = [].concat
    .apply([], timePairs)
    .sort((a: RuleEvent, b: RuleEvent) => {
      const diff = minutesMemo[a[0]][a[1]] - minutesMemo[b[0]][b[1]];
      // End times should go first
      if (diff === 0) return a[1] - b[1];
      return diff;
    });
  return [events, minutesMemo];
};

const timeFromMillis = (millis): Time => {
  const minsAll = (millis / (60 * 1000)) >> 0;
  const hours = (minsAll / 60) >> 0;
  const minutes = minsAll - hours * 60;
  return { hours, minutes };
};

const timeFromMinutes = (mins: number): Time => {
  const hours = (mins / 60) >> 0;
  const minutes = mins - hours * 60;
  return { hours, minutes };
};

const appliedRuleAssignmentsForGroup = (
  group: IParkingRuleAssignmentGroup,
  vehicle: IVehicle,
  start: Time,
  end: Time
) => {
  const [events, minutesMemo] = transformRuleAssignmentsIntoRuleEvents(
    group,
    start,
    end
  );
  // Stores indexes and orders them according to the values
  // under indices in group.ruleAssignments
  const heap = new LinearHeap<number>(
    (i, j) =>
      // Priority by ParkingRuleAssignment's priority
      group.ruleAssignments[i].priority - group.ruleAssignments[j].priority
  );
  let currentRuleAssignmentI = -1; // index, -1 => no rule is being used
  let currentRuleAssignmentFrom: number = null; // in minutes from midnight
  // Result for this group
  const appliedRuleAssignments: Array<{
    start: Time;
    end: Time;
    assignment: IParkingRuleAssignment;
  }> = [];
  for (let i = 0; i < events.length; i++) {
    // index - into group.ruleAssignments, se - START/END
    const [index, se] = events[i];
    const ruleAssignment: IParkingRuleAssignment = group.ruleAssignments[index];
    const currentRuleAssignment: IParkingRuleAssignment =
      group.ruleAssignments[currentRuleAssignmentI];
    // Time in minutes of the current event
    const eventMins = minutesMemo[index][se];
    if (se === RuleEventEnum.START) {
      // No current rule assignment AND next one applies
      if (
        currentRuleAssignmentI === -1 &&
        ruleAppliesToVehicle(ruleAssignment.vehicleSelectors, vehicle._id)
      ) {
        // Use next rule
        currentRuleAssignmentI = index;
        currentRuleAssignmentFrom = eventMins;
      }
      // Using a rule assignment AND next rule assignment has higher priority
      else if (
        currentRuleAssignmentI !== -1 &&
        currentRuleAssignment.priority < ruleAssignment.priority &&
        ruleAppliesToVehicle(ruleAssignment.vehicleSelectors, vehicle)
      ) {
        // Apply
        appliedRuleAssignments.push({
          start: timeFromMinutes(currentRuleAssignmentFrom),
          end: timeFromMinutes(eventMins),
          assignment: currentRuleAssignment
        });
        // Stash if current rule assignment may be used in future
        if (
          minutesMemo[index][RuleEventEnum.END] <
          minutesMemo[currentRuleAssignmentI][RuleEventEnum.END]
        ) {
          heap.add(currentRuleAssignmentI);
        }
        // Use next rule
        currentRuleAssignmentI = index;
        currentRuleAssignmentFrom = eventMins;
      }
      // Next rule assignment has lower priority.
      // Since checking whether it applies to the vehicle is potentially expensive (N*M),
      // we put it in the heap and check whether it applies when it is truly needed.
      else if (
        currentRuleAssignmentI !== -1 &&
        currentRuleAssignment.priority > ruleAssignment.priority &&
        // Stash if it can be used in future after this rule assignment
        minutesMemo[index][RuleEventEnum.END] >
          minutesMemo[currentRuleAssignmentI][RuleEventEnum.END]
      ) {
        heap.add(index);
      }
    } else if (se === RuleEventEnum.END) {
      if (currentRuleAssignmentI !== -1 && currentRuleAssignmentI === index) {
        // End current rule assignments by adding it into an array with correct time
        // Apply
        appliedRuleAssignments.push({
          start: timeFromMinutes(currentRuleAssignmentFrom),
          end: timeFromMinutes(eventMins),
          assignment: currentRuleAssignment
        });
        // Get rule assignment from the heap
        let nextRuleAssignmentI = heap.extractTop();
        const canBeUsed = (j: number) =>
          minutesMemo[j][RuleEventEnum.END] > eventMins &&
          ruleAppliesToVehicle(
            group.ruleAssignments[j].vehicleSelectors,
            vehicle
          );
        while (heap.size() && !canBeUsed(nextRuleAssignmentI)) {
          nextRuleAssignmentI = heap.extractTop();
        }
        if (nextRuleAssignmentI !== null && canBeUsed(nextRuleAssignmentI)) {
          // Use next rule
          currentRuleAssignmentI = nextRuleAssignmentI;
          currentRuleAssignmentFrom = eventMins;
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
  // TODO: Solve the Date issues
  // Fetch ParkingRuleDayAssignment
  const ds = moment(start)
    .startOf("day")
    .toDate();
  const dayAssignmentsResult: Array<
    IParkingRuleDayAssignment
  > = await ParkingRuleDayAssignment.find({
    day: { $gte: ds, $lte: end }
  }).populate({
    path: "groups",
    populate: {
      path: "ruleAssignments.vehicleSelectors.filter"
    }
  });
  // Relative time
  const startTime = timeFromMillis(start.getTime() - ds.getTime());
  const endTime = timeFromMillis(end.getTime() - start.getTime());
  // Result object
  const appliedRuleAssignmentsAll: { [key: string]: Array<any> } = {};
  for (const day of dayAssignmentsResult) {
    const dayKey = day.day.toISOString().slice(0, 10); // Without time
    for (const group of day.groups) {
      const groupResult = appliedRuleAssignmentsForGroup(
        group,
        vehicle,
        startTime,
        endTime
      );
      if (!!appliedRuleAssignmentsAll[dayKey]) {
        appliedRuleAssignmentsAll[dayKey].push(groupResult);
      } else {
        appliedRuleAssignmentsAll[dayKey] = [groupResult];
      }
    }
  }
  return appliedRuleAssignmentsAll;
};

export const handleResult = async (
  { best, candidates, coordinates, rectangle }: LicensePlateRecognitionResult,
  device: IDevice,
  captureTime: Date
) => {
  // No result
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
    // TODO: Use rules. Calculate fee, etc.
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
  } else {
    res.status(200).end();
  }

  // Process
  if (req.files == null) return next();
  const files = req.files;

  try {
    const filename = Object.keys(files)[0];
    const captureTime = filenameToDate(filename);
    const result = await getLprResult(files[filename]);
    // console.log(id, "RSLT", new Date(), result);
    handleResult(result, device, captureTime);
    return next();
  } catch (err) {
    return next(err);
  }
};

export default capture;
