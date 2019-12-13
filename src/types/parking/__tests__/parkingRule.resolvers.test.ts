import {
  ParkingRule,
  ParkingRulePermitAccess,
  ParkingRuleTimedFee
} from "../parkingRule.model";
import { VehicleSelectorEnum, VehicleFilter } from "../vehicleFilter.model";
import { connect, disconnect } from "../../../db/index";
import resolvers from "../parkingRule.resolvers";
import { models } from "../../../db/models";

const ctx = { models };

describe("ParkingRule resolvers", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(
    async () =>
      await Promise.all([ParkingRule.remove({}), VehicleFilter.remove({})])
  );

  it("ParkingRule.vehicles", async () => {
    const vf1 = await new VehicleFilter({ name: "filter1" }).save();
    const vf2 = await new VehicleFilter({ name: "filter2" }).save();
    const populated = await new ParkingRule({
      name: "name1",
      vehicles: [
        { singleton: VehicleSelectorEnum.ALL },
        { filter: vf1.id },
        { filter: vf2.id },
        { singleton: VehicleSelectorEnum.NONE }
      ]
    }).save();
    const notPopulated = await ParkingRule.findById(populated.id);
    function verifyResult(vehicles) {
      expect(vehicles).toBeInstanceOf(Array);
      expect(vehicles[0].value).toBe(VehicleSelectorEnum.ALL);
      expect(vehicles[1].toObject()).toMatchObject(vf1.toObject());
      expect(vehicles[2].toObject()).toMatchObject(vf2.toObject());
      expect(vehicles[3].value).toBe(VehicleSelectorEnum.NONE);
    }
    for (const resolver of [
      resolvers.ParkingRuleTimedFee.vehicles,
      resolvers.ParkingRulePermitAccess.vehicles
    ]) {
      verifyResult(await resolver(notPopulated, null, ctx));
    }
  });

  it("ParkingRule.__resolveType", async () => {
    const permitAccess = new ParkingRulePermitAccess({});
    expect(resolvers.ParkingRule.__resolveType(permitAccess)).toBe(
      "ParkingRulePermitAccess"
    );

    const timedFee = new ParkingRuleTimedFee({});
    expect(resolvers.ParkingRule.__resolveType(timedFee)).toBe(
      "ParkingRuleTimedFee"
    );
  });
});
