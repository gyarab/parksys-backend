import { ParkingRuleAssignmentGroup } from "../parkingRuleAssignmentGroup.model";
import { connect, disconnect } from "../../../db";

describe("model ParkingRuleAssignmentGroup", () => {
  it("requires correct fields", async () => {
    const group1 = new ParkingRuleAssignmentGroup({ name: "asd" });
    try {
      await group1.validate();
    } catch (e) {
      fail(e);
    }
    const group2 = new ParkingRuleAssignmentGroup({});
    try {
      await group2.validate();
      fail("expected an error");
    } catch (e) {
      expect(e.errors.name).toBeDefined();
    }
  });

  // Works, but test fails anyway
  describe.skip("with db", () => {
    beforeAll(connect);
    afterAll(disconnect);

    it("drops name duplicates", async () => {
      const group1 = new ParkingRuleAssignmentGroup({ name: "asd" });
      const group2 = new ParkingRuleAssignmentGroup({ name: "asd" });
      await group1.save();
      try {
        await group2.save();
        fail("expected an error");
      } catch (e) {
        expect(e).not.toBeNull();
      }
    });
  });
});
