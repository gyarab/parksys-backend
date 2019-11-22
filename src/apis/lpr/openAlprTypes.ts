import { Candidate, Coordinate } from "./types";

// Generated using https://jvilk.com/MakeTypes/
export interface OAlprResponse {
  results?: (OAlprResult)[] | null;
  width: number;
  height: number;
}

export interface OAlprResult {
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
