import { ParkingRuleAssignment } from "../parkingRuleAssignment.model";
import { VehicleSelectorEnum } from "../vehicleFilter.model";

describe("model ParkingRuleAssignment", () => {
  it("requires correct fields", async () => {
    const assignment1 = new ParkingRuleAssignment({
      rule: "5df3c05a28516f4419b44333",
      start: {
        hours: 9,
        minutes: 0
      },
      end: {
        hours: 24,
        minutes: 0
      },
      priority: 0,
      vehicleSelectors: [{ singleton: VehicleSelectorEnum.ALL }] // not requried
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
      expect(err.errors.rule).toBeDefined();
      expect(err.errors.priority).toBeDefined();
      expect(err.errors["vehicleSelectors.0.singleton"]).toBeDefined();
      expect(err.errors["vehicleSelectors.0.filter"]).toBeDefined();
      expect(err.errors["start.hours"]).toBeDefined();
      expect(err.errors["start.minutes"]).toBeDefined();
      expect(err.errors["end.hours"]).toBeDefined();
      expect(err.errors["end.minutes"]).toBeDefined();
    }
  });
});
