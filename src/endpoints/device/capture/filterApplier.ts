import { VehicleFilterAction } from "../../../types/parking/vehicleFilter.model";
import { IVehicle } from "../../../types/vehicle/vehicle.model";
import {
  IParkingRuleAssignment,
  VehicleFilterMode,
} from "../../../types/parking/parkingRuleAssignment.model";
import lodash from "lodash";

export const createFilterApplier = (vehicle: IVehicle) => {
  const vId = vehicle._id.toString();
  // Cache answers
  const cache: { [id: string]: boolean } = {};
  return (ruleAssignment: IParkingRuleAssignment): boolean => {
    const rId = ruleAssignment._id.toString();
    if (cache[rId] !== undefined) {
      // Return already calculated answers
      return cache[rId];
    } else if (!ruleAssignment.active) {
      return false;
    }
    const all = ruleAssignment.vehicleFilterMode === VehicleFilterMode.ALL;
    const none = !all;
    // Assumes ruleAssignment is populated
    // JS reduce wasn't checking the types correctly for some reason.
    const idSet: Set<string> = lodash.reduce(
      ruleAssignment.vehicleFilters,
      (idSet, filter) => {
        const include = filter.action === VehicleFilterAction.INCLUDE;
        const exclude = !include;
        if ((all && exclude) || (none && include)) {
          // Add to set
          for (const id of filter.vehicles) {
            idSet.add(id.toString());
          }
        } else {
          // Remove from set
          for (const id of filter.vehicles) {
            idSet.delete(id.toString());
          }
        }
        return idSet;
      },
      new Set()
    );
    // This could be substituted with an XOR operation but that would be unreadable
    if (all) {
      // Exclusion mode
      cache[rId] = !idSet.has(vId);
    } else {
      // Inclusion mode
      cache[rId] = idSet.has(vId);
    }
    return cache[rId];
  };
};
