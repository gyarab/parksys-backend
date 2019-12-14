import sharp from "sharp";
import tmp from "tmp";
import crypto from "crypto";
import { AsyncHandler } from "../../app";
import lpr from "../../apis/lpr";
import { Device, IDevice } from "../../types/device/device.model";
import { LicensePlateRecognitionResult } from "../../apis/lpr/types";
import { Vehicle } from "../../types/vehicle/vehicle.model";
import { Check } from "../../types/parking/check.model";
import {
  ParkingSession,
  IParkingSession
} from "../../types/parking/parkingSession.model";

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

const handleResult = async (
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
  console.log(vehicle);
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
    console.log(id, "RSLT", new Date(), result);
    handleResult(result, device, captureTime);
    return next();
  } catch (err) {
    return next(err);
  }
};

export default capture;
