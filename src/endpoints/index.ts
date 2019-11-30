import { Router } from "express";
import routes from "./routes";
import loginPasswordEndpoint from "./login/password";
import qrEndpoint from "./device/qr";
import deviceAactivationEndpoint from "./device/activationPassword";
import { checkPermissionReqBuilder } from "../auth/auth";
import { Permission } from "../types/permissions";
import captureEndpoint from "./capture/capture";

const rootRouter = Router();

// TODO: Change permissions appropriately
// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPasswordEndpoint);
rootRouter.get(
  routes["devices/qr"].path,
  checkPermissionReqBuilder([Permission.ALL]),
  qrEndpoint
);
rootRouter.post(routes["devices/activate"].path, deviceAactivationEndpoint);
rootRouter.post(
  routes["capture"].path,
  checkPermissionReqBuilder([Permission.ALL]),
  captureEndpoint
);

export default rootRouter;
