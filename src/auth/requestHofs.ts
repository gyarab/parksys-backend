import { verifyToken } from "./jwt";
import { RefreshToken } from "../types/refreshToken/refreshToken.model";
import { NextFunction, Response } from "express";
import { Resolver, ResolverWithPermissions } from "../db/gql";
import { PRequest } from "../app";
import config from "../config";
import mongoose from "mongoose";
import { Permission } from "../types/permissions";
import lodash from "lodash";
import { AccessTokenData } from "./tokenUtils";

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

export const checkAuthorizationHeader = async (
  req: any
): Promise<AccessTokenData | null> => {
  if (req == null || req.headers == null || req.headers.authorization == null) {
    return null;
  }
  const now = new Date();
  const authHeader = String(req.headers.authorization);
  const split = authHeader.split(" ");
  if (split.length !== 2 || split[0] !== "Bearer") {
    return null;
  }
  const token = split[1];
  try {
    const [valid, body]: [boolean, AccessTokenData] = verifyToken(
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
  const wrapper = (req: PRequest<any>, res: Response, next: NextFunction) => {
    const permissions = lodash.get(
      req,
      "token.user.permissions",
      lodash.get(req, "token.device.permissions", [])
    );
    if (hasPermissions(requiredPermissions, permissions)) {
      return next();
    } else {
      res.status(403).send("Unauthorized");
      return next(new Error("Unauthorized"));
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
    const permissions = lodash.get(
      ctx,
      "token.user.permissions",
      lodash.get(ctx, "token.device.permissions", [])
    );
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
