import { hasPermissions, checkAuthenticationHeader } from "../auth";
import { Permission } from "../../types/permissions";
import { createToken } from "../jwt";
import config from "../../config";
import {
  RefreshToken,
  IRefreshTokenDocument
} from "../../types/refreshToken/refreshToken.model";
import { begin } from "../../app";
import { disconnect } from "../../db";

const cryptSecret = config.get("cryptSecret");
const createReq = (authHeader: string) => {
  return {
    headers: {
      authentication: authHeader
    }
  };
};

describe("checkAuthenticationHeader", () => {
  it("should return correct results", async () => {
    const in10min = new Date(new Date().getTime() + 600 * 1000);
    // Ok token
    const rt1 = await new RefreshToken({}).save();
    const token1 = `Bearer ${createToken(cryptSecret, {
      roid: rt1.id,
      a: 123,
      expiresAt: in10min
    })}`;
    expect(await checkAuthenticationHeader(createReq(token1))).toStrictEqual({
      roid: rt1.id,
      a: 123,
      expiresAt: in10min
    });

    // Invalid tokens
    const token2 = "Bearer abcd";
    expect(await checkAuthenticationHeader(createReq(token2))).toBeNull();

    const rt3 = await new RefreshToken({}).save();
    const token3 = `What ${createToken(config.get("cryptSecret"), {
      roid: rt3.id,
      b: { c: 456 }
    })}`;
    expect(await checkAuthenticationHeader(createReq(token3))).toBeNull();

    // Invalid inputs should be handled well
    expect(await checkAuthenticationHeader(createReq(null))).toBeNull();
    expect(await checkAuthenticationHeader(null)).toBeNull();

    // Valid token with an invalid or non-existent RefreshToken
    const rt4 = await new RefreshToken({
      revokedAt: new Date() // now
    }).save();
    const token4 = `Bearer ${createToken(config.get("cryptSecret"), {
      roid: rt4.id,
      b: { c: 456 }
    })}`;
    expect(await checkAuthenticationHeader(createReq(token4))).toBeNull();

    // Non-existent RefreshToken
    const token5 = `Bearer ${createToken(config.get("cryptSecret"), {
      roid: "5dd93feac000005bf9eff50d",
      b: { c: 456 }
    })}`;
    expect(await checkAuthenticationHeader(createReq(token5))).toBeNull();

    const rt6 = await new RefreshToken({}).save();
    const token6 = `Bearer ${createToken(cryptSecret, {
      roid: rt6.id,
      a: 123,
      expiresAt: new Date(new Date().getTime() - 1)
    })}`;
    expect(await checkAuthenticationHeader(createReq(token6))).toBeNull();

    // Valid token without expiration
    const rt7 = await new RefreshToken({}).save();
    const token7 = `Bearer ${createToken(cryptSecret, {
      roid: rt7.id
    })}`;
    expect(await checkAuthenticationHeader(createReq(token7))).toStrictEqual({
      roid: rt7.id
    });
  });

  beforeAll(async () => {
    await begin();
  });

  afterAll(async () => {
    await RefreshToken.remove({});
    await disconnect();
  });
});

const hasPermissionsCases: [Permission[], string[], boolean][] = [
  [[], [Permission.ALL], true],
  [[Permission.DEVICES], [Permission.ALL], true],
  [[Permission.ALL], [Permission.DEVICES], false],
  [[Permission.DEVICES, Permission.DEVICES], [Permission.DEVICES], true]
];

describe("hasPermissions", () => {
  it("should return correct results", () => {
    hasPermissionsCases.forEach(([required, supplied, expectedResult]) => {
      expect(hasPermissions(required, supplied)).toBe(expectedResult);
    });
  });
});

// TODO: Test the rest of the permission checkers that use hasPermissions
