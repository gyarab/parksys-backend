import nconf from "nconf";
import path from "path";

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at '/config/{NODE_ENV}.json'
//   4. Defaults

// Separator is __
nconf.argv().env("__");
nconf.file({
  file: path.join(__dirname, "..", "config", `${process.env.NODE_ENV}.json`)
});
nconf.defaults({
  impls: {
    example: "impl1",
    apis: {
      lpr: {
        // Chosen Implementation
        i: "expressOpenAlpr",
        expressOpenAlpr: {
          protocol: "http",
          host: "127.0.0.1",
          port: 4500,
          country_code: "eu"
        }
      }
    },
    cache: {
      i: "memory",
      memory: {
        // No config needed
      }
    }
  },
  security: {
    cryptSecret: "bc59412d08b71442dc41437175784380",
    userAccessTokenDuration: 1000 * 60 * 10, // 10 minutes
    deviceAccessTokenDuration: 1000 * 60 * 30, // 30 minutes
    activationPasswordDuration: 1000 * 60 // 1 minutes
  },
  mongo: {
    host: "127.0.0.1",
    port: 27017,
    db: "dev_parksys"
  },
  server: {
    host: "0.0.0.0",
    port: 8080
  },
  ping: true,
  recognitionCache: {
    k: 2
  },
  capture: {
    tofile: false,
    tofilePath: null,
    log: false
  }
});

export default nconf;
