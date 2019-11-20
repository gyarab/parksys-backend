import { Device } from "../device.model";

describe("Device", () => {
  it("has correct required fields and defaults", () => {
    const empty = new Device();

    empty.validate(errors => {
      expect(errors.errors.name).toBeDefined;
      expect(errors.errors.activationPassword).toBeDefined;
      expect(errors.errors.activated).toBeDefined;
    });
    expect(empty.activated).toBe(false);
    expect(empty.activationPassword.payload).toBeDefined();
  });
});

