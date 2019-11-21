import config from "../../config";
import axios, { AxiosResponse } from "axios";
import Clipper from "image-clipper";
import Canvas from "canvas";
import base64Img from "base64-img";
import {
  Coordinate,
  Candidate,
  LicensePlateRecognition,
  LicensePlateRecognitionResult,
  Rectangle
} from "./types";

const { host, port } = config.get("impls:apis:lpr:expressOpenAlpr");
const url = `http://${host}:${port}/plates`;

// Generated using https://jvilk.com/MakeTypes/
export interface Response {
  results?: (Result)[] | null;
  width: number;
  height: number;
}

export interface Result {
  plate: string;
  confidence: number;
  matches_template: number;
  plate_index: number;
  region: string;
  region_confidence: number;
  processing_time_ms: number;
  requested_topn: number;
  coordinates?: (Coordinate)[] | null;
  candidates?: (Candidate)[] | null;
}

export const findRectangle = (a: Coordinate[]) => {
  let xMax = a[0].x;
  let yMax = a[1].y;
  let xMin = a[0].x;
  let yMin = a[1].y;
  for (let i = 1; i < a.length; i++) {
    xMax = Math.max(xMax, a[i].x);
    yMax = Math.max(yMax, a[i].y);
    xMin = Math.min(xMin, a[i].x);
    yMin = Math.min(yMin, a[i].y);
  }
  const points = [
    {
      x: xMin,
      y: yMin
    },
    {
      x: xMin,
      y: yMax
    },
    {
      x: xMax,
      y: yMax
    },
    {
      x: xMax,
      y: yMin
    }
  ];
  return {
    points,
    width: xMax - xMin,
    height: yMax - yMin
  };
};

export const cropImageRectangle = async (
  imagePath: string,
  outputPath: string,
  rectangle: Rectangle,
  offset: number = 50
) => {
  return await new Promise(resolve => {
    Clipper(imagePath, { canvas: Canvas }, function() {
      const args = [
        rectangle.start.x - offset,
        rectangle.start.y - offset,
        rectangle.width + offset * 2,
        rectangle.height + offset * 2
      ];
      this.crop(...args);
      this.toFile(outputPath, () => resolve(true));
    });
  });
};

export default class ExpressOpenAlpr implements LicensePlateRecognition {
  private transformResponse(response: Response): LicensePlateRecognitionResult {
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
