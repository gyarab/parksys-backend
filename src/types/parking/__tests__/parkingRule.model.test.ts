import {
  ParkingRule,
  ParkingRuleTimedFee,
  ParkingRulePermitAccess,
  ParkingTimeUnit
} from "../parkingRule.model";

describe("model ParkingRule", () => {
  const correctParkingRuleBase = {
    name: "rule name"
  };

  it("requires correct fields and uses VehicleSelector", async () => {
    const rule1 = new ParkingRule({});
    try {
      await rule1.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.name).toBeDefined();
    }
  });

  // Discriminators
  describe("discriminator ParkingRuleTimedFee", () => {
    it("has discriminator key", () => {
      expect(new ParkingRuleTimedFee({}).__t).toBe("ParkingRuleTimedFee");
    });

    it("requires the correct fields", async () => {
      const rule1 = new ParkingRuleTimedFee({
        ...correctParkingRuleBase,
        unitTime: ParkingTimeUnit.HOUR,
        centsPerUnitTime: 10000
      });
      try {
        await rule1.validate();
      } catch (e) {
        fail(e);
      }
      const rule2 = new ParkingRuleTimedFee({ ...correctParkingRuleBase });
      try {
        await rule2.validate();
        fail("expected an error");
      } catch (err) {
        expect(err.errors.unitTime).toBeDefined();
        expect(err.errors.centsPerUnitTime).toBeDefined();
      }
    });
  });

  describe("discriminator ParkingRulePermitAccess", () => {
    it("has discriminator key", () => {
      expect(new ParkingRulePermitAccess({}).__t).toBe(
        "ParkingRulePermitAccess"
      );
    });

    it("requires the correct fields", async () => {
      const rule1 = new ParkingRulePermitAccess({
        ...correctParkingRuleBase,
        permit: true
      });
      try {
        await rule1.validate();
      } catch (e) {
        fail(e);
      }
      const rule2 = new ParkingRulePermitAccess({ ...correctParkingRuleBase });
      try {
        await rule2.validate();
        fail("expected an error");
      } catch (err) {
        expect(err.errors.permit).toBeDefined();
      }
    });
  });
});
