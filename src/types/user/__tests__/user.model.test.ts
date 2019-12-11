import { User, UserSchema } from "../user.model";
import lodash from "lodash";
import { RefreshTokenName } from "../../refreshToken/refreshToken.model";

describe("User", () => {
  it("has correct required fields", async () => {
    const empty = new User();

    try {
      await empty.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.name).toBeDefined();
      expect(err.errors.email).toBeDefined();
    }
  });

  it("refreshTokens are references", () => {
    expect(lodash.get(UserSchema, "obj.refreshTokens.0.ref")).toBe(
      RefreshTokenName
    );
  });
});
