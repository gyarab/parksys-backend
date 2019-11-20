// Load schema types, create the ApolloServer
import { ApolloServer } from "apollo-server-express";
import { merge } from "lodash";
import path from "path";
import fs from "fs";
import userResolvers from "../types/user/user.resolvers";
import deviceResolvers from "../types/device/device.resolvers";

// Inspired by https://github.com/FrontendMasters/intro-to-graphql
const types = ["user", "refreshToken", "authentication", "device"];

function loadSchemaFile(path): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.exists(path, exists => {
      if (!exists) reject(`File does not exist (${path})`);
      fs.readFile(path, { encoding: "UTF-8" }, (err, schema) => {
        if (err) reject(err);
        resolve(schema);
      });
    });
  });
}

function loadSchemaTypes(type: string) {
  const schemaPath = path.join(process.cwd(), `src/types/${type}/${type}.gql`);
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
  try {
    const schemaTypes: string[] = await Promise.all(types.map(loadSchemaTypes));
    const apollo = new ApolloServer({
      typeDefs: [rootSchema, scalars, ...schemaTypes],
      resolvers: merge({}, userResolvers, deviceResolvers),
      context({ req }) {
        return { token: req["token"] };
      }
    });

    return apollo;
  } catch (e) {
    const msg = `Error occured while creating ApolloServer: ${e}`
    console.error(msg);
    process.exit(1);
  }
};
