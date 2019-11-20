import { generateDeviceActivationPassword } from "../device.model";

describe("devices", () => {
  it("generateDeviceActivationPassword returns correct function", () => {
    const generator = generateDeviceActivationPassword(42);
    const output = generator();
    expect(output.payload.password).toHaveLength(42 * 2);
    expect(output.payload.expiresAt.getTime()).toBeGreaterThan(new Date().getTime());
  });
});
