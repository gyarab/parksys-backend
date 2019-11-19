import { verifyToken } from "./jwt";
import config from "../config";
import { Permission } from "../permissions";
import lodash from "lodash";

// TODO: Test this against invalid input
export const checkAuthenticationHeader = req => {
  const authHeader = String(req.headers["authentication"]);
  const split = authHeader.split(" ");
  if (!authHeader || split.length !== 2 || split[0] !== "Bearer") {
    return null;
  }
  const token = split[1];
  try {
    const [valid, body] = verifyToken(config.get("cryptSecret"), token);
    if (valid) {
      return body;
    }
  } catch (e) {}
  return null;
};

export const checkPermissionReqBuilder = (
  requiredPermissions: Permission[]
) => (req, res, next) => {
  const permissions = lodash.get(req, "token.user.permissions", []);
  if (hasPermissions(requiredPermissions, permissions)) {
    return next();
  } else {
    res.status(403).end();
    return next(false);
  }
};

export const checkPermissionsGqlBuilder = (
  requiredPermissions: Permission[],
  resolver: (obj, args, ctx, info) => any
) => (obj, args, ctx, info) => {
  const permissions = lodash.get(ctx, "token.user.permissions", []);
  if (hasPermissions(requiredPermissions, permissions)) {
    return resolver(obj, args, ctx, info);
  } else {
    // TODO: Throw a custom error
    throw new Error("Insufficient permissions");
  }
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
