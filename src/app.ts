import express, { Request, Response, NextFunction } from "express";
import config from "./config";
import * as db from "./db";
import routes from "./endpoints/routes";
import rootRouter from "./endpoints/index";
import bodyParser from "body-parser";
import cors from "cors";
import { constructGraphQLServer } from "./db/gql";
import { checkAuthenticationHeader, IAccessTokenData } from "./auth/auth";
import fileUpload from "express-fileupload";

export interface PRequest extends Request {
  token?: IAccessTokenData | null;
}

type THandler<T> = (req: PRequest, res: Response, next: NextFunction) => T;
export type AsyncHandler = THandler<Promise<any>>;
export type Handler = THandler<any>;

const app = express();

const corsOptions = {
  // TODO: Move this to settings
  origin: "*"
};

// CORS protection
app.use(cors(corsOptions));
// File upload middleware
app.use(fileUpload({}));
// JSON parser
app.use(bodyParser.json());
// Token authentication middleware
app.use(async (req: PRequest, _, next) => {
  req.token = await checkAuthenticationHeader(req);
  return next();
});
// Mount the root router
app.use("/", rootRouter);

if (config.get("ping")) {
  app.get(routes.ping.path, (_, res) => {
    res.set("Content-Type", "text/plain");
    res.send("pong");
  });
}

const connectApollo = async () => {
  const apollo = await constructGraphQLServer();
  apollo.applyMiddleware({ app });
};

const begin = async () => {
  await connectApollo();
  await db.connect();
};

export { app, begin };
