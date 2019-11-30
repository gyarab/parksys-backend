import axios from "axios";
import base64Img from "base64-img";
import {
  LicensePlateRecognition,
  LicensePlateRecognitionResult
} from "./types";
import { OAlprResponse } from "./openAlprTypes";
import { findRectangle } from "../../utils/image";
import lodash from "lodash";

export interface Config {
  protocol: string;
  host: string;
  port: number;
  country_code: string;
}

export default class ExpressOpenAlpr extends LicensePlateRecognition {
  config: Config;
  apiUrl: string;

  constructor(config: Config) {
    super();
    this.apiUrl = `${config.protocol}://${config.host}:${config.port}/plates`;
    this.config = config;
  }

  private transformResponse(
    response: OAlprResponse
  ): LicensePlateRecognitionResult {
    console.log(response);
    if (response.results.length == 0) {
      return {
        best: null
      };
    }
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
    return new Promise((resolve, reject) => {
      axios
        .post(this.apiUrl, {
          image,
          country_code: this.config.country_code
        })
        .then(response => resolve(this.transformResponse(response.data)))
        .catch(error => {
          const msg = lodash.get(error, "response.data.error", "");
          const status = lodash.get(error, "response.status", 0);
          if (msg === "No plates found in image" && status === 400) {
            resolve({
              best: null
            });
          } else {
            reject(error);
          }
        });
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
