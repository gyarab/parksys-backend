import express, { Request, Response, NextFunction } from "express";
import config from "./config";
import * as db from "./db";
import routes from "./endpoints/routes";
import rootRouter from "./endpoints/index";
import bodyParser from "body-parser";
import cors from "cors";
import { constructGraphQLServer } from "./db/gql";
import { checkAuthorizationHeader, IAccessTokenData } from "./auth/auth";
import fileUpload from "express-fileupload";
import { Params } from "express-serve-static-core";
import compression from "compression";

export interface PRequest<T extends Params> extends Request<T> {
  token?: IAccessTokenData | null;
}

export type THandler<T, P extends Params> = (
  req: PRequest<P>,
  res: Response,
  next: NextFunction
) => T;
export type AsyncHandler<P extends Params = Params> = THandler<Promise<any>, P>;
export type Handler<P extends Params = Params> = THandler<any, P>;

const app = express();

const corsOptions = {
  // TODO: Move this to settings
  origin: "*"
};

// Compression
app.use(compression());
// CORS protection
app.use(cors(corsOptions));
// File upload middleware
app.use(fileUpload({}));
// JSON parser
app.use(bodyParser.json());
// Token authentication middleware
app.use(async (req: PRequest<any>, _, next) => {
  req.token = await checkAuthorizationHeader(req);
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
