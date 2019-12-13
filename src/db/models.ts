import { User } from "../types/user/user.model";
import { Device } from "../types/device/device.model";
import { RefreshToken } from "../types/refreshToken/refreshToken.model";
import { Authentication } from "../types/authentication/authentication.model";
import { VehicleFilter } from "../types/parking/vehicleFilter.model";
import {
  ParkingRule,
  ParkingRuleTimedFee,
  ParkingRulePermitAccess
} from "../types/parking/parkingRule.model";

export const models = {
  User,
  Device,
  RefreshToken,
  Authentication,
  VehicleFilter,
  ParkingRule,
  ParkingRuleTimedFee,
  ParkingRulePermitAccess
};
