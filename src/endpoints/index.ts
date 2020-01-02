import { Router } from "express";
import routes from "./routes";
import loginPasswordEndpoint from "./login/password";
import changePasswordEndpoint from "./login/passwordChange";
import qrEndpoint from "./device/qr";
import deviceAactivationEndpoint from "./device/activationPassword";
import { checkPermissionReqBuilder } from "../auth/requestHofs";
import { Permission } from "../types/permissions";
import captureEndpoint from "./device/capture";
import { Handler } from "../app";
import lodash from "lodash";
import updateConfigEndpoint from "./device/updateConfig";

const rootRouter = Router();

const deviceOnly: Handler<any> = (req, res, next) => {
  if (lodash.get(req, "token.device") instanceof Object) {
    return next();
  } else {
    res.status(403);
    return next(new Error("Only devices are allowed to access this endpoint."));
  }
};

// TODO: Change permissions appropriately
// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPasswordEndpoint);
rootRouter.put(routes["login/passwordChange"].path, changePasswordEndpoint);

rootRouter.get(
  routes["devices/qr"].path,
  checkPermissionReqBuilder([Permission.ALL]),
  qrEndpoint
);

// Device
rootRouter.post(routes["devices/activate"].path, deviceAactivationEndpoint);
rootRouter.post(
  routes["devices/capture"].path,
  deviceOnly,
  checkPermissionReqBuilder([Permission.ALL]),
  captureEndpoint
);
rootRouter.put(routes["devices/config"].path, deviceOnly, updateConfigEndpoint);

export default rootRouter;
