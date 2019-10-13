import app from "./app";
import config from "./config";

const server = app.listen(config.get("server:port"), () =>
  console.log(
    `Parking System Backend listening on port ${config.get("server:port")}!`
  )
);

export = server;
