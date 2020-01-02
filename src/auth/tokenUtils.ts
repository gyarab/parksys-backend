import { Model } from "mongoose";
import { AuthenticationMethod } from "../types/authentication/authentication.model";
import { Permission } from "../types/permissions";
import { IRefreshToken } from "../types/refreshToken/refreshToken.model";
import { createToken } from "./jwt";
import config from "../config";

const cryptSecret = config.get("security:cryptSecret");

export interface IRefreshTokenData {
  oid?: string;
  method: AuthenticationMethod;
}

export interface IAccessTokenData {
  roid?: string;
  expiresAt?: number;
  user?: {
    id: any;
    permissions: Permission[] | string[];
  };
  device?: {
    id: any;
    permissions: Permission[] | string[];
  };
}

export const createTokenPair = async (
  aTokenData: IAccessTokenData,
  rTokenData: IRefreshTokenData,
  RefreshToken: Model<IRefreshToken, {}>
): Promise<{
  accessToken: string;
  refreshToken: {
    str: string;
    obj: IRefreshToken;
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
    accessToken: accessTokenStr,
    refreshToken: {
      str: refreshTokenStr,
      obj: refreshTokenDb
    }
  };
};
