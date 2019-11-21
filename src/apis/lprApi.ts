import config from "../config";
import axios, { AxiosResponse } from "axios";

const { host, port } = config.get("apis").lpr;
const url = `http://${host}:${port}/plates`;

// Generated using https://jvilk.com/MakeTypes/
export interface LprResponse {
  results?: (ResultsEntity)[] | null;
  width: number;
  height: number;
}
export interface ResultsEntity {
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

export interface Coordinate {
  x: number;
  y: number;
}

export interface Candidate {
  plate: string;
  confidence: number;
  matches_template: number;
}

export const recognizePlate = async (
  img
): Promise<AxiosResponse<LprResponse>> => {
  return await axios.post(url, {
    image: img,
    country_code: "eu"
  });
};

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
