import express from "express";
import config from "./config";
import db from "./db";
import routes from "./endpoints/routes";
import rootRouter from "./endpoints/index";
import bodyParser from "body-parser";
import cors from "cors";

db().init();
const app = express();

const corsOptions = {
  // TODO: Move this to settings
  origin: "*"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/", rootRouter);

if (config.get("ping")) {
  app.get(routes.ping.path, (req, res) => {
    res.set("Content-Type", "text/plain");
    res.send("pong");
  });
}

export = app;
