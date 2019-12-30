import resolvers from "../authentication.resolvers";
import { disconnect, connect } from "../../../db";
import { models } from "../../../db/models";
import { verifyToken, verifyTokenPair } from "../../../auth/jwt";
import config from "../../../config";
import lodash from "lodash";
import { AuthenticationMethod } from "../authentication.model";
import { User } from "../../../types/user/user.model";
import { hashPassword } from "../../../auth/auth";

const ctx = { models };
const cryptSecret = config.get("security:cryptSecret");

describe("authentication resolvers", () => {
  beforeAll(async () => {
    await connect();
    await new User({
      name: "user1",
      email: "user1@example.com",
      authentications: [
        {
          method: AuthenticationMethod.PASSWORD,
          payload: {
            h: await hashPassword("1234", "NaCl"),
            s: "NaCl"
          }
        }
      ]
    }).save();
    await new User({
      name: "user2",
      email: "user2@example.com",
      authentications: [
        {
          method: AuthenticationMethod.PASSWORD,
          payload: {
            h: await hashPassword("5678", "KCl"),
            s: "KCl"
          }
        }
      ]
    }).save();
  });
  afterAll(disconnect);

  describe("Mutation.passwordLogin(user, password)", () => {
    it("succeeds", async () => {
      const result = await resolvers.Mutation.passwordLogin(
        null,
        { user: "user1", password: "1234" },
        ctx
      );
      const { refreshToken, accessToken, user } = result;

      expect(verifyTokenPair(refreshToken, accessToken, cryptSecret)).toBe(
        true
      );

      // Check the accessToken body
      const [_, accessTokenBody] = verifyToken(cryptSecret, accessToken);
      expect(lodash.get(accessTokenBody, "user.id", undefined)).toBeDefined();
      expect(
        lodash.get(accessTokenBody, "user.permissions", undefined)
      ).toBeDefined();

      // Check the refreshToken body
      const [__, refreshTokenBody] = verifyToken(cryptSecret, refreshToken);
      expect(lodash.get(refreshTokenBody, "method")).toBe(
        AuthenticationMethod.PASSWORD
      );

      expect(user.name).toBe("user1");
    });

    it("fails", async () => {
      try {
        const a = await resolvers.Mutation.passwordLogin(
          null,
          { user: "user2", password: "abcd" },
          ctx
        );
        console.log(a); // this should not print out
        fail("expected an error");
      } catch (err) {
        expect(err).not.toBeNull();
      }
    });
  });

  it("Mutation.passwordChange(currentPassword, newPassword)", async () => {
    // Create token pair, change password, relogin
    return;
  });
});
