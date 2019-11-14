import { Router } from "express";
import routes from "./routes";
import loginPassword from "./login/password";
import { User } from "../db";

const rootRouter = Router();

// Mount all other routes
rootRouter.post(routes["login/password"].path, loginPassword);
rootRouter.get("/what", (req, res) => {
  console.log("WHAT");
  res.status(200).end();
});
rootRouter.get("/userTest", (req, res) => {
  console.log("HELLO");
  User.findAll().then(users => res.json(users));
});

export default rootRouter;
