import sharp from "sharp";
import tmp from "tmp";
import path from "path";
import { AsyncHandler } from "../../../app";
import lpr from "../../../apis/lpr";
import { Device, IDevice } from "../../../types/device/device.model";
import {
  LicensePlateRecognitionResult,
  Candidate
} from "../../../apis/lpr/types";
import { Vehicle } from "../../../types/vehicle/vehicle.model";
import { Check } from "../../../types/parking/check.model";
import {
  ParkingSession,
  IParkingSession
} from "../../../types/parking/parkingSession.model";
import cache from "../../../cache";
import config from "../../../config";
import { DeviceType } from "../../../types/device/deviceConfig.model";
import { CaptureImage } from "../../../types/captureImage/captureImage.model";
import { Rectangle } from "../../../utils/image";
import { applyRules } from "./ruleApplier";
import { findAppliedRules } from "./ruleResolver";

const log = config.get("capture:log") || false;

const getLprResult = (file: any) =>
  new Promise<[LicensePlateRecognitionResult, string, () => void]>(
    (resolve, reject) => {
      tmp.file((err, fname, _, removeTmpFile) => {
        if (err) reject(err);
        const recognition = sharp(file.data)
          .toFile(fname)
          .then(_ => lpr.recognizeLicensePlate(fname));
        const toFile = !!config.get("capture:tofile")
          ? sharp(file.data)
              .toFile(
                path.join(
                  config.get("capture:tofilePath"),
                  new Date().getTime() + ".jpg"
                )
              )
              .catch(err => console.error(err))
          : null;
        Promise.all([recognition, toFile])
          .then(([result, _]) => {
            resolve([result, fname, removeTmpFile]);
          })
          .catch(err => reject(err));
      });
    }
  );

export const handleResult = async (
  best: Candidate,
  device: IDevice,
  captureTime: Date,
  imgFilePath: string,
  licensePlateRectangle: Rectangle
) => {
  // console.log(new Date(), best, candidates);
  // No result
  if (log) {
    console.log("!handling", best);
  }
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
    const offset = config.get("capture:cutOffset") || 0;
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
    check.images = [await saveImage()];
    parkingSession.checkOut = check;
    parkingSession.active = false;
    // Image may error out
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
    if (log) {
      console.warn(
        `Device (${deviceIdentity}) and vehicle direction (session=${sessionIdentity} do not match`
      );
    }
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
  const device = await Device.findById(req.token.device.id);
  if (!device) {
    res.status(400).send("device not found");
    return next();
  }

  if (device.shouldSendConfig || !device.config.capturing) {
    const response = {
      data: { config: device.config }
    };
    res.send(response);
    device.shouldSendConfig = false;
  } else {
    res.send({});
  }

  device.lastContact = new Date();
  await device.save();

  if (!device.config.capturing) {
    console.log(
      `Device ${device.id} is trying to capture although config says otherwise`
    );
    return next();
  }
  // Process
  if (req.files == null) {
    if (log) {
      console.log("No file received");
    }
    return next();
  }
  const files = req.files;

  try {
    const filename = Object.keys(files)[0];
    const captureTime = filenameToDate(filename);
    const [result, fname, deleteTmpFile] = await getLprResult(files[filename]);
    if (result.best === null) {
      deleteTmpFile();
      if (log) {
        console.log("No result");
      }
      return next();
    } else if (log) {
      console.log("result", result.best, result.candidates);
    }
    const licensePlateArea = result.rectangle.width * result.rectangle.height;
    if (licensePlateArea < device.config.minArea) {
      if (log) {
        console.log("Low area: " + result.rectangle);
      }
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
