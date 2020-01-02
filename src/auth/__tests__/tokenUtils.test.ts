import {
  createTokenPair,
  renewUserAccessToken,
  userAccessTokenData,
  deviceAccessTokenData
} from "../tokenUtils";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";
import { connect, disconnect } from "../../db";
import config from "../../config";
import { verifyTokenPair, verifyToken } from "../jwt";
import { User } from "../../types/user/user.model";
import { Device } from "../../types/device/device.model";

const jsonAndBack = a => JSON.parse(JSON.stringify(a));
const cryptSecret = config.get("security:cryptSecret");

describe("tokenUtils", () => {
  beforeAll(connect);
  afterAll(disconnect);
  afterEach(
    async () =>
      await Promise.all([
        RefreshToken.remove({}),
        User.remove({}),
        Device.remove({})
      ])
  );

  it("createTokenPair", async () => {
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
    const dbRToken = await RefreshToken.findById(refreshToken.obj.oid);
    expect(dbRToken).not.toBeNull();
  });

  describe("renewUserAccessToken", () => {
    let user;
    let tokenPair1;
    let tokenPair2;

    beforeEach(async () => {
      user = (await User.create([
        {
          name: "user1",
          email: "user1@example.com"
        }
      ]))[0].toObject();
      tokenPair1 = await createTokenPair(
        userAccessTokenData(user),
        { method: AuthenticationMethod.TEST },
        RefreshToken
      );
      tokenPair2 = await createTokenPair(
        userAccessTokenData(user),
        { method: AuthenticationMethod.TEST },
        RefreshToken
      );
      // Revoke the RefreshToken of the second pair
      await RefreshToken.findByIdAndUpdate(tokenPair2.refreshToken.db.id, {
        revokedAt: new Date(new Date().getTime() - 1000) // 1 second ago
      });
    });

    it("valid refresh", async () => {
      const { str, obj } = await renewUserAccessToken(
        tokenPair1.refreshToken.obj,
        user,
        RefreshToken
      );
      const [valid, obj2] = verifyToken(cryptSecret, str);
      expect(valid).toBe(true);
      // One of these has CoreMongooseArray (instead of Array) but it has the sama information
      expect(jsonAndBack(obj)).toStrictEqual(jsonAndBack(obj2));
    });

    it("invalid refresh", async () => {
      const result = await renewUserAccessToken(
        tokenPair2.refreshToken.obj,
        user,
        RefreshToken
      );
      expect(result).toBeNull();
    });
  });
  describe("renewDeviceAccessToken", () => {
    let device;
    let tokenPair1;
    let tokenPair2;

    beforeEach(async () => {
      device = (await Device.create([
        {
          name: "device1"
        }
      ]))[0].toObject();
      tokenPair1 = await createTokenPair(
        deviceAccessTokenData(device),
        { method: AuthenticationMethod.TEST },
        RefreshToken
      );
      tokenPair2 = await createTokenPair(
        deviceAccessTokenData(device),
        { method: AuthenticationMethod.TEST },
        RefreshToken
      );
      // Revoke the RefreshToken of the second pair
      await RefreshToken.findByIdAndUpdate(tokenPair2.refreshToken.db.id, {
        revokedAt: new Date(new Date().getTime() - 1000) // 1 second ago
      });
    });

    it("valid refresh", async () => {
      const { str, obj } = await renewUserAccessToken(
        tokenPair1.refreshToken.obj,
        device,
        RefreshToken
      );
      const [valid, obj2] = verifyToken(cryptSecret, str);
      expect(valid).toBe(true);
      // One of these has CoreMongooseArray (instead of Array) but it has the sama information
      expect(jsonAndBack(obj)).toStrictEqual(jsonAndBack(obj2));
    });

    it("invalid refresh", async () => {
      const result = await renewUserAccessToken(
        tokenPair2.refreshToken.obj,
        device,
        RefreshToken
      );
      expect(result).toBeNull();
    });
  });
});
