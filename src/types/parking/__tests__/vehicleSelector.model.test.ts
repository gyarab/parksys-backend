import { VehicleSelector } from "../vehicleSelector.model";
import { VehicleSelectorEnum } from "../vehicleFilter.model";

describe("model ParkingRule", () => {
  it("requires correct fields", async () => {
    const selector1 = new VehicleSelector({
      filter: "5deeaed22ac8dd0db99c9d8a"
    });
    try {
      await selector1.validate();
    } catch (err) {
      fail(err);
    }

    const selector2 = new VehicleSelector({
      singleton: VehicleSelectorEnum.ALL
    });
    try {
      await selector2.validate();
    } catch (err) {
      fail(err);
    }

    // Both fields are not allowed
    const selector3 = new VehicleSelector({
      singleton: VehicleSelectorEnum.NONE,
      filter: "5deeaed22ac8dd0db99c9d8a"
    });
    try {
      await selector3.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.singleton).toBeDefined();
      expect(err.errors.filter).toBeDefined();
    }

    // Neither of the fields
    const selector4 = new VehicleSelector({
      singleton: VehicleSelectorEnum.NONE,
      filter: "5deeaed22ac8dd0db99c9d8a"
    });
    try {
      await selector4.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.singleton).toBeDefined();
      expect(err.errors.filter).toBeDefined();
    }
  });
});
