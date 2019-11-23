import { cropImageRectangle } from "../utils/image";
import path from "path";
import { LicensePlateRecognition } from "../apis/lpr/types";
import ExpressOpenAlpr from "../apis/lpr/expressOpenAlpr";

const img = process.argv[2];

(async () => {
  const recognizer: LicensePlateRecognition = new ExpressOpenAlpr();
  const result = await recognizer.recognizeLicensePlate(img);
  console.log(result);
  const cutLicensePlateImgPath = path.join(
    process.cwd(),
    `rect_${result.best.plate}.jpg`
  );
  await cropImageRectangle(img, cutLicensePlateImgPath, result.rectangle);
})();
