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
    vehicles: { singleton: VehicleSelectorEnum.ALL }
  };

  // Basic ParkingRule functionality
  it("can contain either vehicles.filter or vehicles.singleton", async () => {
    const rule1 = new ParkingRule({
      name: "rule1",
      vehicles: {
        filter: "5deeaed22ac8dd0db99c9d8a"
      }
    });
    rule1.validate(err => {
      expect(err).toBeNull();
    });

    const rule2 = new ParkingRule({
      name: "rule2",
      vehicles: {
        singleton: VehicleSelectorEnum.ALL
      }
    });
    rule2.validate(err => {
      expect(err).toBeNull();
    });

    // Both fields are not allowed
    const rule3 = new ParkingRule({
      name: "rule3",
      vehicles: {
        singleton: VehicleSelectorEnum.NONE,
        filter: "5deeaed22ac8dd0db99c9d8a"
      }
    });
    rule3.validate(err => {
      expect(err).not.toBeNull();
      expect(err.errors["vehicles.singleton"]).toBeDefined();
      expect(err.errors["vehicles.filter"]).toBeDefined();
    });

    // None of the fields is not allowed either
    const rule4 = new ParkingRule({});
    rule4.validate(err => {
      expect(err).not.toBeNull();
      expect(err.errors["vehicles.singleton"]).toBeDefined();
      expect(err.errors["vehicles.filter"]).toBeDefined();
    });
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
        expect(err).not.toBeNull();
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
        expect(err).not.toBeNull();
        expect(err.errors.permit).toBeDefined();
      }
    });
  });
});
