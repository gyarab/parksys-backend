import { Router } from "express";
import routes from "./routes";
import loginPassword from "./login/password";

const rootRouter = Router();

// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPassword);

export default rootRouter;
