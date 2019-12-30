import {
  ParkingRuleAssignment,
  VehicleFilterMode
} from "../parkingRuleAssignment.model";

describe("model ParkingRuleAssignment", () => {
  const now = new Date();
  const validBase = {
    rules: ["5df3c05a28516f4419b44333"],
    start: now,
    end: new Date(now.getTime() + 1000),
    priority: 0,
    vehicleFilterMode: VehicleFilterMode.ALL,
    active: true
  };

  it("requires correct fields and has defaults", async () => {
    const assignment1 = new ParkingRuleAssignment(validBase);
    try {
      await assignment1.validate();
    } catch (e) {
      fail(e);
    }

    const assignment2 = new ParkingRuleAssignment({
      vehicleSelectors: [{}]
    });
    expect(assignment2.active).toBe(false);
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

  it("validates start <= end", async () => {
    const assignment = new ParkingRuleAssignment({
      ...validBase,
      start: new Date(now),
      end: new Date(now.getTime() - 1000 * 3600)
    });
    try {
      await assignment.validate();
      fail("expected an error");
    } catch (e) {
      expect(e.errors.end).toBeDefined();
    }
  });
});
