import express from "express";
import config from "./config";
import * as db from "./db";
import routes from "./endpoints/routes";
import rootRouter from "./endpoints/index";
import bodyParser from "body-parser";
import cors from "cors";
import { constructGraphQLServer } from "./db/gql";
import { checkAuthenticationHeader } from "./auth/auth";

const app = express();

const corsOptions = {
  // TODO: Move this to settings
  origin: "*"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use((req, _, next) => {
  req["token"] = checkAuthenticationHeader(req);
  return next();
});
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
