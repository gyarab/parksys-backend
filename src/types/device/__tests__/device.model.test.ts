import { Device, DeviceSchema } from "../device.model";
import { RefreshTokenName } from "../../refreshToken/refreshToken.model";
import lodash from "lodash";

describe("Device", () => {
  it("has correct required fields", async () => {
    const empty = new Device();
    try {
      await empty.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.name).toBeDefined();
    }
  });

  it("has correct defaults", () => {
    const empty = new Device();
    expect(empty.activated).toBe(false);
    expect(empty.activationPassword.payload).toBeDefined();
  });

  it("refreshToken is a reference", () => {
    expect(lodash.get(DeviceSchema, "obj.refreshToken.ref")).toBe(
      RefreshTokenName
    );
  });
});
