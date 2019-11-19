import { Router } from "express";
import routes from "./routes";
import loginPasswordEndpoint from "./login/password";
import qrEndpoint from "./device/qr";
import activationEndpoint from "./device/activationPassword";
import { checkPermissionReqBuilder } from "../auth/auth";
import { Permission } from "../permissions";

const rootRouter = Router();

// TODO: Change permissions appropriately
// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPasswordEndpoint);
rootRouter.get(
  routes["devices/qr"].path,
  checkPermissionReqBuilder([Permission.ALL]),
  qrEndpoint
);
rootRouter.post(routes["devices/activate"].path, activationEndpoint);

export default rootRouter;
