import { app, startDb } from "./app";
import config from "./config";

startDb().then(() => {
  app.listen(config.get("server:port"), () =>
    console.log(
      `Parking System Backend listening on port ${config.get("server:port")}!`
    )
  );
});
