import { Router } from "express";
import routes from "./routes";
import loginPassword from "./login/password";
import User from "../db/models/User";

const rootRouter = Router();

// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPassword);

rootRouter.post("/user", async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

export default rootRouter;
