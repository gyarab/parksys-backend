import { VehicleSelectorEnum, VehicleFilter } from "../vehicleFilter.model";
import vehicleSelectorResolvers from "../vehicleSelector.resolvers";

describe("VehicleSelector resolvers", () => {
  it("VehicleSelector.__resolveType", () => {
    expect(
      vehicleSelectorResolvers.VehicleSelector.__resolveType(
        new VehicleFilter({ name: "filter" })
      )
    ).toBe("VehicleFilter");

    expect(
      vehicleSelectorResolvers.VehicleSelector.__resolveType({
        value: VehicleSelectorEnum.ALL
      })
    ).toBe("VehicleSelectorSingleton");
  });
});
