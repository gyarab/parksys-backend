import { VehicleSelectorEnum } from "../vehicleFilter.model";
import {
  ParkingRule,
  ParkingRuleTimedFee,
  ParkingRulePermitAccess,
  ParkingTimeUnit
} from "../parkingRule.model";

describe("model ParkingRule", () => {
  const correctParkingRuleBase = {
    name: "rule name",
    vehicles: [{ singleton: VehicleSelectorEnum.ALL }]
  };

  // Basic ParkingRule functionality
  it("required correct fields", async () => {
    const rule1 = new ParkingRule({
      name: "rule1",
      vehicles: [
        {
          filter: "5deeaed22ac8dd0db99c9d8a"
        }
      ]
    });
    try {
      await rule1.validate();
    } catch (err) {
      fail(err);
    }

    const rule2 = new ParkingRule({
      name: "rule2",
      vehicles: [
        {
          singleton: VehicleSelectorEnum.ALL
        }
      ]
    });
    try {
      await rule2.validate();
    } catch (err) {
      fail(err);
    }

    // Both fields are not allowed
    const rule3 = new ParkingRule({
      vehicles: [
        {
          singleton: VehicleSelectorEnum.NONE,
          filter: "5deeaed22ac8dd0db99c9d8a"
        }
      ]
    });
    try {
      await rule3.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.name).toBeDefined();
      expect(err.errors["vehicles.0.singleton"]).toBeDefined();
      expect(err.errors["vehicles.0.filter"]).toBeDefined();
    }
  });

  // Discriminators
  describe("discriminator ParkingRuleTimedFee", () => {
    it("has discriminator key", () => {
      expect(new ParkingRuleTimedFee({}).__t).toBeDefined();
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
      expect(new ParkingRulePermitAccess({}).__t).toBeDefined();
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