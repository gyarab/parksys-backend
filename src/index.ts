import app from "./app";

const port = 3000;

const server = app.listen(port, () =>
  console.log(`Parking System Backend listening on port ${port}!`)
);

export = server;
