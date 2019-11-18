import nconf from "nconf";
import path from "path";

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at '/config/{NODE_ENV}.json'
//   4. Defaults
nconf.argv().env();
nconf.file({
  file: path.join(__dirname, "..", "config", `${process.env.NODE_ENV}.json`)
});
nconf.defaults({
  impls: {
    example: "impl1"
  },
  mongo: {
    host: "127.0.0.1",
    port: 27017
  },
  server: {
    port: 8080
  },
  ping: true,
  cryptSecret: "bc59412d08b71442dc41437175784380"
});

export default nconf;
