import { LicensePlateRecognition } from "./types";

class CmdOpenAlpr extends LicensePlateRecognition {
  recognizeLicensePlateB64(
    image: string
  ): Promise<import("./types").LicensePlateRecognitionResult> {
    throw new Error("Method not implemented.");
  }
  recognizeLicensePlate(
    path: string
  ): Promise<import("./types").LicensePlateRecognitionResult> {
    throw new Error("Method not implemented.");
  }
}
