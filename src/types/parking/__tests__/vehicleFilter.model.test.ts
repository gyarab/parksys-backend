import { VehicleFilter } from "../vehicleFilter.model";
import { connect, disconnect } from "../../../db";

describe("model VehicleFilter", () => {
  let filter1 = null;
  let filter2 = null;
  let filter3 = null;

  it("has correct required fields", async () => {
    const vf1 = new VehicleFilter({ name: "one" });
    try {
      await vf1.validate();
    } catch (e) {
      fail(e);
    }
    const vf2 = new VehicleFilter({});
    try {
      await vf2.validate();
      fail("expected an error");
    } catch (err) {
      expect(err).not.toBeNull();
      expect(err.errors.name).toBeDefined();
    }
  });

  it("cannot save cyclic filters", async () => {
    filter1.inheritsFrom = filter3;
    try {
      await filter1.save();
      fail("expected an error");
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  beforeAll(async () => {
    await connect();
    filter1 = await new VehicleFilter({ name: "filter1" }).save();
    filter2 = await new VehicleFilter({
      name: "filter2",
      inheritsFrom: filter1
    }).save();
    filter3 = await new VehicleFilter({
      name: "filter3",
      inheritsFrom: filter2
    }).save();
  });
  afterAll(disconnect);
});
