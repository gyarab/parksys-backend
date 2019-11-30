import { verifyToken, createToken } from "./jwt";
import config from "../config";
import { Permission } from "../types/permissions";
import lodash from "lodash";
import {
  RefreshToken,
  IRefreshTokenDocument
} from "../types/refreshToken/refreshToken.model";
import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { Resolver, ResolverWithPermissions } from "../db/gql";

const cryptSecret = config.get("security:cryptSecret");

const verifyAccessTokenBody = (body: any, time: Date): boolean => {
  // No Date -> valid, invalid Date -> invalid
  if (body.expiresAt != null) {
    const expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return false;
    body.expiresAt = expiresAt;
  }

  return (
    body.roid &&
    mongoose.Types.ObjectId.isValid(body.roid) &&
    (body.expiresAt == null || body.expiresAt.getTime() > time.getTime())
  );
};

// TODO: Test this against invalid input
export const checkAuthenticationHeader = async (
  req: any
): Promise<IAccessTokenData | null> => {
  if (
    req == null ||
    req.headers == null ||
    req.headers.authentication == null
  ) {
    return null;
  }
  const now = new Date();
  const authHeader = String(req.headers.authentication);
  const split = authHeader.split(" ");
  if (!authHeader || split.length !== 2 || split[0] !== "Bearer") {
    return null;
  }
  const token = split[1];
  try {
    const [valid, body]: [boolean, IAccessTokenData] = verifyToken(
      cryptSecret,
      token
    );
    if (valid && verifyAccessTokenBody(body, now)) {
      // Find refresh token
      const refreshToken = await RefreshToken.findOne({
        _id: body.roid,
        // Not revoked or revoked in future
        $or: [{ revokedAt: null }, { revokedAt: { $gt: now } }]
      });
      if (refreshToken != null) {
        return body;
      }
    }
  } catch (e) {}
  return null;
};

export const checkPermissionReqBuilder = (
  requiredPermissions: Permission[]
) => {
  const wrapper = (req: Request, res: Response, next: NextFunction) => {
    const permissions = lodash.get(req, "token.user.permissions", []);
    if (hasPermissions(requiredPermissions, permissions)) {
      return next();
    } else {
      res.status(403);
      return next(false);
    }
  };
  wrapper.requiredPermissions = requiredPermissions;
  return wrapper;
};

export const checkPermissionsGqlBuilder = (
  requiredPermissions: Permission[],
  resolver: Resolver
) => {
  const wrapper: ResolverWithPermissions = (obj, args, ctx, info) => {
    const permissions = lodash.get(ctx, "token.user.permissions", []);
    if (hasPermissions(requiredPermissions, permissions)) {
      return resolver(obj, args, ctx, info);
    } else {
      // TODO: Throw a custom error
      throw new Error("Insufficient permissions");
    }
  };
  wrapper.requiredPermissions = requiredPermissions;
  return wrapper;
};

export const hasPermissions = (
  requiredPermissions: Permission[],
  suppliedPermissions: string[]
): boolean => {
  if (suppliedPermissions.includes(Permission.ALL)) {
    return true;
  }
  return requiredPermissions.every(permission =>
    suppliedPermissions.includes(permission)
  );
};

export interface IRefreshTokenData {
  oid?: string;
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
  aTokenData: IAccessTokenData
): Promise<{
  accessToken: string;
  refreshToken: {
    str: string;
    obj: IRefreshTokenDocument;
  };
}> => {
  const refreshTokenDb = await new RefreshToken({}).save();
  const rTokenData: IRefreshTokenData = {
    oid: refreshTokenDb.id.toString()
  };
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
