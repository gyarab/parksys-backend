export interface LicensePlateRecognitionResult {
  best: Candidate;
  candidates?: (Candidate[]) | null;
  coordinates?: (Coordinate[]) | null;
  rectangle?: (Rectangle) | null;
}

export interface Rectangle {
  start: Coordinate;
  width: number;
  height: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Candidate {
  plate: string;
  confidence?: number | null;
}

export interface LicensePlateRecognition {
  // *image* is a base64 encoded image content
  recognizeLicensePlateB64(
    image: string
  ): Promise<LicensePlateRecognitionResult>;
  // *path* is a filepath
  recognizeLicensePlate(path: string): Promise<LicensePlateRecognitionResult>;
}
