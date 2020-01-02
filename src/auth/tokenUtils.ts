import { Model } from "mongoose";
import { AuthenticationMethod } from "../types/authentication/authentication.model";
import { Permission } from "../types/permissions";
import { IRefreshToken } from "../types/refreshToken/refreshToken.model";
import { createToken } from "./jwt";
import config from "../config";

const cryptSecret = config.get("security:cryptSecret");

export interface RefreshTokenData {
  oid?: string;
  method: AuthenticationMethod;
}

export interface AccessTokenDataBase {
  roid?: string;
  expiresAt?: number;
}

export interface UserAccessTokenData extends AccessTokenDataBase {
  user?: {
    id: any;
    permissions: Permission[] | string[];
  };
}

export interface DeviceAccessTokenData extends AccessTokenDataBase {
  device?: {
    id: any;
    permissions: Permission[] | string[];
  };
}

// Intersection
export type AccessTokenData = UserAccessTokenData & DeviceAccessTokenData;

export const userAccessTokenData = (
  user: UserAccessTokenData["user"],
  time: Date = new Date()
): UserAccessTokenData => {
  return {
    expiresAt: time.getTime() + config.get("security:userAccessTokenDuration"),
    user
  };
};

export const deviceAccessTokenData = (
  device: DeviceAccessTokenData["device"],
  time: Date = new Date()
): DeviceAccessTokenData => {
  return {
    expiresAt: time.getTime() + config.get("security:userAccessTokenDuration"),
    device
  };
};

export const createTokenPair = async (
  aTokenData: AccessTokenData,
  rTokenData: RefreshTokenData,
  RefreshToken: Model<IRefreshToken, {}>
): Promise<{
  accessToken: {
    str: string;
    obj: AccessTokenData;
  };
  refreshToken: {
    str: string;
    obj: RefreshTokenData;
    db: IRefreshToken;
  };
}> => {
  const refreshTokenDb = await new RefreshToken({
    method: rTokenData.method
  }).save();
  rTokenData.oid = refreshTokenDb.id.toString();
  const refreshTokenStr = createToken(cryptSecret, rTokenData);

  aTokenData.roid = refreshTokenDb.id.toString();
  const accessTokenStr = createToken(cryptSecret, aTokenData);

  return {
    accessToken: {
      str: accessTokenStr,
      obj: aTokenData
    },
    refreshToken: {
      str: refreshTokenStr,
      obj: rTokenData,
      db: refreshTokenDb
    }
  };
};

const renewAccessToken = async (
  rTokenData: RefreshTokenData,
  data: AccessTokenData,
  RefreshToken: Model<IRefreshToken, {}>
): Promise<{ str: string; obj: AccessTokenData } | null> => {
  const rTExistsNotRevoked = await RefreshToken.find({
    _id: rTokenData.oid,
    $or: [
      { revokedAt: { $gt: new Date() } }, // revoked in future
      { revokedAt: null } // not revoked
    ]
  });
  if (rTExistsNotRevoked.length > 0) {
    // Refresh access token
    return {
      str: createToken(cryptSecret, data),
      obj: data
    };
  } else {
    // Access token cannot be refreshed
    return null;
  }
};

export const renewUserAccessToken = async (
  rTokenData: RefreshTokenData,
  user: UserAccessTokenData["user"],
  RefreshToken: Model<IRefreshToken, {}>
): Promise<{ str: string; obj: UserAccessTokenData }> =>
  renewAccessToken(rTokenData, userAccessTokenData(user), RefreshToken);

export const renewDeviceAccessToken = async (
  rTokenData: RefreshTokenData,
  device: DeviceAccessTokenData["device"],
  RefreshToken: Model<IRefreshToken, {}>
): Promise<{ str: string; obj: DeviceAccessTokenData }> =>
  renewAccessToken(rTokenData, deviceAccessTokenData(device), RefreshToken);
