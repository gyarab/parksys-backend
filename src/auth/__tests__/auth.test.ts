import {
  hasPermissions,
  checkAuthorizationHeader,
  checkPermissionReqBuilder,
  checkPermissionsGqlBuilder
} from "../auth";
import { Permission } from "../../types/permissions";
import { createToken } from "../jwt";
import config from "../../config";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";
import { begin } from "../../app";
import { disconnect } from "../../db";
import mockReqRes from "mock-req-res";
import { Context } from "../../db/gql";
import { models } from "../../db/models";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";

const cryptSecret = config.get("security:cryptSecret");
const createReq = (authHeader: string) => {
  return {
    headers: {
      authorization: authHeader
    }
  };
};
const rTokenPayload = { method: AuthenticationMethod.TEST };

describe("checkAuthenticationHeader", () => {
  beforeAll(begin);
  afterAll(disconnect);

  it("should return correct results", async () => {
    const in10min = new Date(new Date().getTime() + 600 * 1000);
    // Ok token
    const rt1 = await new RefreshToken(rTokenPayload).save();
    const token1 = `Bearer ${createToken(cryptSecret, {
      roid: rt1.id,
      a: 123,
      expiresAt: in10min
    })}`;
    expect(await checkAuthorizationHeader(createReq(token1))).toStrictEqual({
      roid: rt1.id,
      a: 123,
      expiresAt: in10min
    });

    // Invalid tokens
    const token2 = "Bearer abcd";
    expect(await checkAuthorizationHeader(createReq(token2))).toBeNull();

    const rt3 = await new RefreshToken(rTokenPayload).save();
    const token3 = `What ${createToken(cryptSecret, {
      roid: rt3.id,
      b: { c: 456 }
    })}`;
    expect(await checkAuthorizationHeader(createReq(token3))).toBeNull();

    // Valid token with an invalid or non-existent RefreshToken
    const rt4 = await new RefreshToken({
      revokedAt: new Date(), // now
      ...rTokenPayload
    }).save();
    const token4 = `Bearer ${createToken(config.get("security:cryptSecret"), {
      roid: rt4.id,
      b: { c: 456 }
    })}`;
    expect(await checkAuthorizationHeader(createReq(token4))).toBeNull();

    // Non-existent RefreshToken
    const token5 = `Bearer ${createToken(cryptSecret, {
      roid: "5dd93feac000005bf9eff50d",
      b: { c: 456 }
    })}`;
    expect(await checkAuthorizationHeader(createReq(token5))).toBeNull();

    const rt6 = await new RefreshToken(rTokenPayload).save();
    const token6 = `Bearer ${createToken(cryptSecret, {
      roid: rt6.id,
      a: 123,
      expiresAt: new Date(new Date().getTime() - 1)
    })}`;
    expect(await checkAuthorizationHeader(createReq(token6))).toBeNull();

    // Valid token without expiration
    const rt7 = await new RefreshToken(rTokenPayload).save();
    const token7 = `Bearer ${createToken(cryptSecret, {
      roid: rt7.id
    })}`;
    expect(await checkAuthorizationHeader(createReq(token7))).toStrictEqual({
      roid: rt7.id
    });
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

describe("checkPermissionReqBuilder", () => {
  function shouldWork(key: "user" | "device") {
    hasPermissionsCases.forEach(([required, supplied, expectedResult]) => {
      const next = jest.fn();
      const req = mockReqRes.mockRequest();
      const res = mockReqRes.mockResponse();
      req["token"] = {
        [key]: {
          id: "",
          permissions: supplied
        }
      };
      checkPermissionReqBuilder(required)(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      if (expectedResult === false) {
        // Should fail
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(res.status.getCall(0).args[0]).toBe(403);
      } else {
        // Should be ok
        expect(next.mock.calls[0].length).toBe(0);
      }
    });
  }

  it("should work for users", () => {
    shouldWork("user");
  });

  it("should work for devices", () => {
    shouldWork("device");
  });
});

describe("checkPermissionGqlBuilder", () => {
  function shouldWork(key: "user" | "device") {
    hasPermissionsCases.forEach(([required, supplied, expectedResult]) => {
      const resolver = jest.fn();
      const ctx: Context = {
        token: {
          [key]: {
            id: "",
            permissions: supplied
          }
        },
        models
      };
      const func = () =>
        checkPermissionsGqlBuilder(required, resolver)("1", "2", ctx, "3");
      if (expectedResult === false) {
        // Should fail
        expect(func).toThrowError();
      } else {
        // Should be ok
        func();
        expect(resolver).toHaveBeenCalledTimes(1);
        expect(resolver.mock.calls[0]).toMatchObject(["1", "2", ctx, "3"]);
      }
    });
  }

  it("should work for users", () => {
    shouldWork("user");
  });

  it("should work for devices", () => {
    shouldWork("device");
  });
});
