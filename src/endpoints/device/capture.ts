import sharp from "sharp";
import tmp from "tmp";
import { AsyncHandler } from "../../app";
import lpr from "../../apis/lpr";
import { Device } from "../../types/device/device.model";
import { LicensePlateRecognitionResult } from "../../apis/lpr/types";

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

const capture: AsyncHandler<any> = async (req, res, next) => {
  // Send back device config if updated
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
    const result = await getLprResult(files[Object.keys(files)[0]]);
    // console.log(result);
    return next();
  } catch (err) {
    return next(err);
  }
};

export default capture;
