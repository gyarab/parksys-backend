import { Router } from "express";
import routes from "./routes";
import loginPassword from "./login/password";

const rootRouter = Router();

// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPassword);
rootRouter.get("/what", (req, res) => {
  console.log("WHAT");
  res.status(200).end();
});

export default rootRouter;
