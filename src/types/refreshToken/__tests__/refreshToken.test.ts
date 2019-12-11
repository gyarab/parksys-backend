import { RefreshToken } from "../refreshToken.model";

describe("RefreshToken", () => {
  it("has correct required files", async () => {
    const empty = new RefreshToken();

    try {
      await empty.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors).toBeDefined();
      expect(err.errors.method).toBeDefined();
    }
  });

  it("virtual isRevoked returns the right value", () => {
    // Not revoked
    const rt1 = new RefreshToken({
      value: "123",
      revokedAt: new Date(new Date().getTime() + 1000 * 60) // revoked in 60s
    });
    expect(rt1.isRevoked).toBe(false);

    // Not revoked
    const rt2 = new RefreshToken({
      value: "123",
      revokedAt: null // revoked in 60s
    });
    expect(rt2.isRevoked).toBe(false);

    // Revoked
    const rt3 = new RefreshToken({
      value: "123",
      revokedAt: new Date(new Date().getTime() - 1000 * 60) // revoked in 60s
    });
    expect(rt3.isRevoked).toBe(true);
  });
});
