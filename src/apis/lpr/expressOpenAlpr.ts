import config from "../../config";
import axios from "axios";
import base64Img from "base64-img";
import {
  LicensePlateRecognition,
  LicensePlateRecognitionResult
} from "./types";
import { OAlprResponse } from "./openAlprTypes";
import { findRectangle } from "../../utils/image";

const { host, port } = config.get("impls:apis:lpr:expressOpenAlpr");
const url = `http://${host}:${port}/plates`;

export default class ExpressOpenAlpr extends LicensePlateRecognition {
  private transformResponse(
    response: OAlprResponse
  ): LicensePlateRecognitionResult {
    const best = response.results[0];
    const rectangle = findRectangle(best.coordinates);
    return {
      best: {
        plate: best.plate,
        confidence: best.confidence
      },
      candidates: best.candidates,
      coordinates: best.coordinates,
      rectangle: {
        start: rectangle.points[0],
        width: rectangle.width,
        height: rectangle.height
      }
    };
  }

  recognizeLicensePlateB64(
    image: string
  ): Promise<LicensePlateRecognitionResult> {
    return new Promise(async (resolve, reject) => {
      axios
        .post(url, {
          image,
          country_code: "eu"
        })
        .then(response => resolve(this.transformResponse(response.data)))
        .catch(error => reject(error));
    });
  }

  recognizeLicensePlate(path: string): Promise<LicensePlateRecognitionResult> {
    return new Promise((resolve, reject) => {
      base64Img.base64(path, (err, img) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.recognizeLicensePlateB64(img));
      });
    });
  }
}
