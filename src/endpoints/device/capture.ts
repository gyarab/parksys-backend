import sharp from "sharp";
import tmp from "tmp";
import crypto from "crypto";
import { AsyncHandler } from "../../app";
import lpr from "../../apis/lpr";
import { Device, IDevice } from "../../types/device/device.model";
import { LicensePlateRecognitionResult, Candidate } from "../../apis/lpr/types";
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
  IParkingRule,
  ParkingRounding
} from "../../types/parking/parkingRule.model";
import cache from "../../cache";
import config from "../../config";
import { DeviceType } from "../../types/device/deviceConfig.model";
import {
  CaptureImage,
  ICaptureImage
} from "../../types/captureImage/captureImage.model";
import base64Img from "base64-img";
import { cropImageRectangle, Rectangle } from "../../utils/image";
import fs from "fs";

const getLprResult = (file: any, device: IDevice) =>
  new Promise<[LicensePlateRecognitionResult, string, () => void]>(
    (resolve, reject) => {
      tmp.file((err, fname, fd, removeTmpFile) => {
        if (err) reject(err);
        sharp(file.data)
          .resize(device.config.resizeX, device.config.resizeY)
          .toFile(fname)
          .then(_ => {
            lpr
              .recognizeLicensePlate(fname)
              .then(result => {
                resolve([result, fname, removeTmpFile]);
              })
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      });
    }
  );

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
  const result = { feeCents: 0, freeTimeInMinutes: 0 };
  const requiredRules = await getRequiredRules(appliedRules);
  const filledAppliedRules = [];
  for (let i = 0; i < appliedRules.length; i++) {
    const startingFeeCents = result.feeCents;
    const ruleApplication = appliedRules[i];
    const timeDelta =
      ruleApplication.end.getTime() - ruleApplication.start.getTime();
    const filledRules = [];
    for (const ruleId of ruleApplication.assignment.rules) {
      const rule = requiredRules[ruleId];
      filledRules.push(rule.toObject());
      filledRules[filledRules.length - 1].id = rule.id;
      if (rule.__t === "ParkingRuleTimedFee") {
        const coeff = rule.unitTime === ParkingTimeUnit.HOUR ? 60 : 1;
        const divider =
          rule.unitTime === ParkingTimeUnit.MINUTE ? 1000 * 60 : 1000 * 3600;

        result.freeTimeInMinutes += rule.freeInUnitTime * coeff;

        const allUnits = ceilFloorRound(
          timeDelta / divider,
          rule.roundingMethod
        ); // For every started time unit (2.5h == 3h)
        const paidUnits = Math.max(
          allUnits - result.freeTimeInMinutes / coeff,
          0
        );
        result.freeTimeInMinutes -= paidUnits * coeff;
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

export const handleResult = async (
  best: Candidate,
  device: IDevice,
  captureTime: Date,
  imgFilePath: string,
  licensePlateRectangle: Rectangle
) => {
  // console.log(new Date(), best, candidates);
  // No result
  console.log(best);
  if (!best) return;
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
  const saveImage = async (): Promise<string | null> => {
    const { start, width, height } = licensePlateRectangle;
    const offset = 10;
    return sharp(imgFilePath)
      .extract({
        left: start.x - offset,
        top: start.y - offset,
        width: width + offset * 2,
        height: height + offset * 2
      })
      .toBuffer()
      .then(buffer =>
        new CaptureImage({ data: buffer.toString("base64") }).save()
      )
      .then(captureImage => {
        delete captureImage.data;
        return captureImage.id;
      })
      .catch(err => {
        console.log(err);
        return null;
      });
  };
  if (!!parkingSession && device.config.type === DeviceType.OUT) {
    // The vehicle is exiting
    const appliedRules = await findAppliedRules(
      vehicle,
      parkingSession.checkIn.time,
      captureTime
    );
    const [result, filledAppliedRules] = await applyRules(appliedRules);

    parkingSession.appliedAssignments = filledAppliedRules;
    parkingSession.finalFee = result.feeCents;
    parkingSession.checkOut = check;
    parkingSession.active = false;
    // Image may error out
    check.images = [await saveImage()];
    await parkingSession.save();
  } else if (!parkingSession && device.config.type === DeviceType.IN) {
    // The vehicle is entering
    check.images = [await saveImage()];
    parkingSession = await new ParkingSession({
      vehicle,
      checkIn: check
    }).save();
    // Image may error out
  } else {
    const deviceIdentity = `${device.id}:${JSON.stringify(device.config)}`;
    const sessionIdentity = `${!!parkingSession ? parkingSession.id : "null"})`;
    console.warn(
      `Device (${deviceIdentity}) and vehicle direction (session=${sessionIdentity} do not match`
    );
  }
};

export const filenameToDate = (filename: string): Date => {
  const timestamp = Number.parseInt(filename.split("_")[1].split(".")[0]);
  return new Date(timestamp);
};

interface DeviceCacheValue {
  n: number;
  // Sums of percentages of all candidates
  // To find average percentage divide by `n`
  combinedResults: { [key: string]: number };
  // Date.getTime()
  start: number;
}

const combineCacheAndResults = (
  cached: DeviceCacheValue,
  result: LicensePlateRecognitionResult
): DeviceCacheValue => {
  for (const { plate, confidence } of result.candidates) {
    if (typeof cached.combinedResults[plate] === "undefined") {
      cached.combinedResults[plate] = confidence;
    } else {
      cached.combinedResults[plate] += confidence;
    }
  }
  return cached;
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
    const response = {
      data: { config: device.config }
    };
    res.send(response);
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
    const [result, fname, deleteTmpFile] = await getLprResult(
      files[filename],
      device
    );
    if (result.best === null) {
      deleteTmpFile();
      return next();
    }
    const licensePlateArea = result.rectangle.width * result.rectangle.height;
    if (licensePlateArea < device.config.minArea) {
      console.log("Low area: " + result.rectangle);
      deleteTmpFile();
      return next();
    }
    const K = <number>config.get("recognitionCache:k");
    let cached: DeviceCacheValue = cache.get(device.cacheKey());
    // Less than 7 seconds ago
    if (!!cached && cached.start >= new Date().getTime() - 7000) {
      cached = combineCacheAndResults(cached, result);
      cached.n += 1;
    } else {
      cached = combineCacheAndResults(
        {
          n: 1,
          combinedResults: {},
          start: new Date().getTime()
        },
        result
      );
    }
    if (cached.n >= K) {
      // Consume cache
      cache.delete(device.cacheKey());
      // Find the best candidate
      let best: Candidate = { plate: "-", confidence: 0 };
      for (const [plate, newConfidence] of Object.entries(
        cached.combinedResults
      )) {
        if (best === null || newConfidence > best.confidence) {
          best = { plate, confidence: newConfidence };
        }
      }
      // At least 80%
      if (best.confidence / cached.n >= 80) {
        await handleResult(best, device, captureTime, fname, result.rectangle);
      }
    } else {
      cache.set(device.cacheKey(), cached);
    }
    deleteTmpFile();
    return next();
  } catch (err) {
    return next(err);
  }
};

export default capture;
