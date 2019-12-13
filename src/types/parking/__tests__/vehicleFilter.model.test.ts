import { VehicleFilter, IVehicleFilter } from "../vehicleFilter.model";
import { connect, disconnect } from "../../../db";

describe("model VehicleFilter", () => {
  it("has correct required fields", async () => {
    const vf1 = new VehicleFilter({ name: "one" });
    try {
      await vf1.validate();
    } catch (e) {
      fail(e);
    }
    const vf2 = new VehicleFilter({});
    try {
      await vf2.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.name).toBeDefined();
    }
  });
});
