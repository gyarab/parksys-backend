import { ParkingRuleAssignmentGroup } from "../parkingRuleAssignmentGroup.model";
import { connect, disconnect } from "../../../db";
import moment = require("moment");
import { ParkingRuleDayAssignment } from "../parkingRuleDayAssignment.model";

describe("model ParkingRuleAssignmentGroup", () => {
  it("requires correct fields and setters work correctly", async () => {
    const day1 = new ParkingRuleDayAssignment({ day: new Date() });
    expect(day1.day.getHours()).toBe(0);
    expect(day1.day.getMinutes()).toBe(0);
    expect(day1.day.getMilliseconds()).toBe(0);
    try {
      await day1.validate();
    } catch (e) {
      fail(e);
    }
    const day2 = new ParkingRuleDayAssignment({});
    try {
      await day2.validate();
      fail("expected an error");
    } catch (e) {
      expect(e.errors.day).toBeDefined();
    }
  });

  // No internet help with this feature
  describe.skip("with db", () => {
    beforeAll(connect);
    afterAll(disconnect);

    it("drops duplicates", async () => {
      const now = new Date();
      const day1 = new ParkingRuleDayAssignment({ day: now });
      const day2 = new ParkingRuleDayAssignment({ day: now });
      await day1.save();
      console.log(day1, day2);
      try {
        await day2.save();
        fail("expected an error");
      } catch (e) {
        console.log(e);
        expect(e).not.toBeNull();
      }
    });
  });
});
