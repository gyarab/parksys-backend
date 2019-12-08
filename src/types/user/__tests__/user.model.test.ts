import { User, UserSchema } from "../user.model";
import lodash from "lodash";
import { RefreshTokenName } from "../../refreshToken/refreshToken.model";

describe("User", () => {
  it("has correct required fields", () => {
    const empty = new User();

    empty.validate(errors => {
      expect(errors.errors.name).toBeDefined();
      expect(errors.errors.email).toBeDefined();
    });
  });

  it("refreshTokens are references", () => {
    expect(lodash.get(UserSchema, "obj.refreshTokens.0.ref")).toBe(
      RefreshTokenName
    );
  });
});
