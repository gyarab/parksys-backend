import { verifyToken, createToken } from "./jwt";
import config from "../config";
import { Permission } from "../types/permissions";
import lodash from "lodash";
import {
  RefreshToken,
  IRefreshToken
} from "../types/refreshToken/refreshToken.model";
import mongoose, { Model } from "mongoose";
import { NextFunction, Response } from "express";
import { Resolver, ResolverWithPermissions } from "../db/gql";
import { PRequest } from "../app";
import { AuthenticationMethod } from "../types/authentication/authentication.model";
import { IUser } from "../types/user/user.model";
import crypto from "crypto";

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
): Promise<IAccessTokenData | null> => {
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
  const wrapper = (req: PRequest<any>, res: Response, next: NextFunction) => {
    const permissions = lodash.get(
      req,
      "token.user.permissions",
      lodash.get(req, "token.device.permissions", [])
    );
    if (hasPermissions(requiredPermissions, permissions)) {
      next();
    } else {
      res.status(403);
      next(new Error("Unauthorized"));
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
  _RefreshToken: Model<IRefreshToken, {}>
): Promise<{
  accessToken: string;
  refreshToken: {
    str: string;
    obj: IRefreshToken;
  };
}> => {
  const refreshTokenDb = await new _RefreshToken({
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

export const hashPassword = (
  password: string,
  salt: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        const str = hash.toString("hex");
        resolve(str);
      }
    });
  });
};

export const authenticateUser = async (
  userName: string,
  password: string,
  models: { User: Model<IUser, {}>; RefreshToken: Model<IRefreshToken, {}> }
): Promise<any> => {
  const user = await models.User.findOne({
    $or: [{ name: userName }, { email: userName }],
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } }
  });
  if (!user) throw new Error("Unable to authenticate");
  for (const auth of user.authentications.filter(
    auth => auth.method == AuthenticationMethod.PASSWORD
  )) {
    if (
      !auth.payload.hasOwnProperty("h") ||
      !auth.payload.hasOwnProperty("s")
    ) {
      console.error(
        `PASSWORD authentication for user ${user.name} should have h and s props`
      );
      throw new Error("Unable to authenticate");
    }
    const { s: salt, h: hash } = auth.payload;

    const hashResult = await hashPassword(password, salt);
    if (hash === hashResult) {
      // Authenticated
      const aTokenData: IAccessTokenData = {
        expiresAt:
          new Date().getTime() + config.get("security:userAccessTokenDuration"),
        user: {
          id: user.id,
          permissions: user.permissions
        }
      };
      const {
        accessToken,
        refreshToken: { str: refreshToken, obj: refreshTokenObj }
      } = await createTokenPair(
        aTokenData,
        { method: AuthenticationMethod.PASSWORD },
        models.RefreshToken
      );
      user.refreshTokens.push(refreshTokenObj);
      await user.save();

      return {
        refreshToken,
        accessToken,
        user
      };
    }
  }
  throw new Error("Unable to authenticate");
};
