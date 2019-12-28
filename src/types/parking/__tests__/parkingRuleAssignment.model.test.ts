import {
  ParkingRuleAssignment,
  VehicleFilterMode
} from "../parkingRuleAssignment.model";

describe("model ParkingRuleAssignment", () => {
  it("requires correct fields", async () => {
    const assignment1 = new ParkingRuleAssignment({
      rules: ["5df3c05a28516f4419b44333"],
      start: new Date(),
      end: new Date(),
      priority: 0,
      vehicleFilterMode: VehicleFilterMode.ALL
    });
    try {
      await assignment1.validate();
    } catch (e) {
      fail(e);
    }

    const assignment2 = new ParkingRuleAssignment({
      vehicleSelectors: [{}]
    });
    try {
      await assignment2.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.priority).toBeDefined();
      expect(err.errors.vehicleFilterMode).toBeDefined();
      expect(err.errors.start).toBeDefined();
      expect(err.errors.end).toBeDefined();
    }
  });
});
