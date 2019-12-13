import { User } from "../types/user/user.model";
import { Device } from "../types/device/device.model";
import { RefreshToken } from "../types/refreshToken/refreshToken.model";
import { Authentication } from "../types/authentication/authentication.model";
import { VehicleFilter } from "../types/parking/vehicleFilter.model";
import { VehicleSelector } from "../types/parking/vehicleSelector.model";
import { Vehicle } from "../types/vehicle/vehicle.model";
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
  Vehicle,
  VehicleFilter,
  ParkingRule,
  ParkingRuleTimedFee,
  ParkingRulePermitAccess,
  VehicleSelector
};
