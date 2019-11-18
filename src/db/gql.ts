// Load schema types, create the ApolloServer
import { ApolloServer } from "apollo-server-express";
import { merge } from "lodash";
import path from "path";
import fs from "fs";
import userResolvers from "../user/user.resolvers";
import deviceResolvers from "../device/device.resolvers";
import { verifyToken } from "../auth/jwt";
import config from "../config";

// Inspired by https://github.com/FrontendMasters/intro-to-graphql
const types = ["user", "refreshToken", "authentication", "device"];

function loadSchemaFile(path): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: "UTF-8" }, (err, schema) => {
      if (err) reject(err);
      resolve(schema);
    });
  });
}

function loadSchemaTypes(type: string) {
  const schemaPath = path.join(process.cwd(), `src/${type}/${type}.gql`);
  return loadSchemaFile(schemaPath);
}

function loadSchemaScalars() {
  const scalarPath = path.join(process.cwd(), `src/db/scalars.gql`);
  return loadSchemaFile(scalarPath);
}

export const constructGraphQLServer = async () => {
  const rootSchema = `
    type Query
    type Mutation {
      a: String
    }
    schema {
      query: Query
      mutation: Mutation
    }
  `;

  const scalars: string = await loadSchemaScalars();
  const schemaTypes: string[] = await Promise.all(types.map(loadSchemaTypes));
  const apollo = new ApolloServer({
    typeDefs: [rootSchema, scalars, ...schemaTypes],
    resolvers: merge({}, userResolvers, deviceResolvers),
    context({ req }) {
      const authHeader = String(req.headers["authentication"]);
      const split = authHeader.split(" ");
      if (!authHeader || split.length !== 2 || split[0] !== "Bearer") {
        return { token: null };
      }
      const token = split[1];
      try {
        const [valid, body] = verifyToken(config.get("cryptSecret"), token);
        if (valid) {
          return { token: body };
        }
      } catch (e) {}
      return { token: null };
    }
  });

  return apollo;
};