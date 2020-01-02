import { createTokenPair } from "../tokenUtils";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";
import { connect, disconnect } from "../../db";
import config from "../../config";
import { verifyTokenPair, verifyToken } from "../jwt";

const cryptSecret = config.get("security:cryptSecret");

describe("createTokenPair", () => {
  it("works", async () => {
    const now = new Date();
    const { refreshToken, accessToken } = await createTokenPair(
      {
        user: null,
        expiresAt: now.getTime()
      },
      { method: AuthenticationMethod.TEST },
      RefreshToken
    );
    expect(
      verifyTokenPair(refreshToken.str, accessToken.str, cryptSecret)
    ).toBe(true);
    expect(await RefreshToken.exists({ _id: refreshToken.obj.id }));
  });

  beforeAll(connect);
  afterAll(disconnect);
});
