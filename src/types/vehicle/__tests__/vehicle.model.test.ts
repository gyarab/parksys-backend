import { Vehicle } from "../vehicle.model";

describe("model Vehicle", () => {
  it("requires correct fields", async () => {
    const veh1 = new Vehicle({
      licensePlate: "123F4567"
    });
    try {
      await veh1.validate();
    } catch (e) {
      fail(e);
    }
    const veh2 = new Vehicle();
    try {
      await veh2.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.licensePlate).toBeDefined();
    }
  });
});
