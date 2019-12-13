import { VehicleFilter, VehicleSelectorEnum } from "../vehicleFilter.model";
import vehicleSelectorResolvers from "../vehicleSelector.resolvers";
import {
  VehicleSelectorSchema,
  VehicleSelector,
  VehicleSelectorLabel
} from "../vehicleSelector.model";

describe("VehicleSelector resolvers", () => {
  it("VehicleSelector.__resolveType", () => {
    const filter = new VehicleSelector({ filter: "5deeaed22ac8dd0db99c9d8a" });
    expect(vehicleSelectorResolvers.VehicleSelector.__resolveType(filter)).toBe(
      "VehicleFilter"
    );

    const singleton = new VehicleSelector({
      singleton: VehicleSelectorEnum.ALL
    });
    expect(
      vehicleSelectorResolvers.VehicleSelector.__resolveType(singleton)
    ).toBe("VehicleSelectorSingleton");
  });
});
