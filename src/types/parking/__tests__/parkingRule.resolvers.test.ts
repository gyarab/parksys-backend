import {
  ParkingRule,
  ParkingRulePermitAccess,
  ParkingRuleTimedFee
} from "../parkingRule.model";
import { VehicleFilter } from "../vehicleFilter.model";
import { connect, disconnect } from "../../../db/index";
import resolvers from "../parkingRule.resolvers";

describe("ParkingRule resolvers", () => {
  beforeAll(connect);
  afterAll(disconnect);
  beforeEach(
    async () =>
      await Promise.all([ParkingRule.remove({}), VehicleFilter.remove({})])
  );

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
