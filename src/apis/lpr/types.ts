import base64Img from "base64-img";
import { Coordinate, Rectangle } from "../../utils/image";

export type LicensePlateRecognitionResult = {
  best: Candidate | null;
  candidates?: (Candidate[]) | null;
  coordinates?: (Coordinate[]) | null;
  rectangle?: (Rectangle) | null;
};

export type Candidate = {
  plate: string;
  confidence?: number | null;
};

export abstract class LicensePlateRecognition {
  // *image* is a base64 encoded image content
  abstract recognizeLicensePlateB64(
    image: string
  ): Promise<LicensePlateRecognitionResult>;
  // *path* is a filepath
  abstract recognizeLicensePlate(
    path: string
  ): Promise<LicensePlateRecognitionResult>;

  protected loadImage(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      base64Img.base64(path, (err: Error | null, img: string) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(img);
      });
    });
  }
}
