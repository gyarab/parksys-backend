// Load schema types, create the ApolloServer
import { ApolloServer } from "apollo-server-express";
import { merge } from "lodash";
import path from "path";
import fs from "fs";
import userResolvers from "../types/user/user.resolvers";
import deviceResolvers from "../types/device/device.resolvers";
import { Permission } from "../types/permissions";
import { PRequest } from "../app";
import { resolvers as scalarResolvers } from "graphql-scalars";
import { Model } from "mongoose";
import { IUserDocument } from "../types/user/user.model";
import { IDeviceDocument } from "../types/device/device.model";
import { IRefreshTokenDocument } from "../types/refreshToken/refreshToken.model";
import { IAuthenticationDocument } from "../types/authentication/authentication.model";
import { models } from "./models";

// Inspired by https://github.com/FrontendMasters/intro-to-graphql
const types = ["user", "refreshToken", "authentication", "device"];

function loadSchemaFile(path: string): Promise<string> {
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

export type Context = Pick<PRequest<any>, "token"> & {
  models: {
    User: Model<IUserDocument, {}>;
    Device: Model<IDeviceDocument, {}>;
    RefreshToken: Model<IRefreshTokenDocument, {}>;
    Authentication: Model<IAuthenticationDocument, {}>;
  };
};

export type Resolver = (
  obj?: any,
  args?: any,
  ctx?: Context,
  info?: any
) => any;

export interface ResolverWithPermissions extends Resolver {
  requiredPermissions: Permission[];
}

export const constructGraphQLServer = async ():
  | Promise<ApolloServer>
  | never => {
  const rootSchema = `
    type Query
    type Mutation
    schema {
      query: Query
      mutation: Mutation
    }
  `;

  const scalars: string = await loadSchemaScalars();
  try {
    const schemaTypes: string[] = await Promise.all(types.map(loadSchemaTypes));
    const isDev = process.env.NODE_ENV === "development";
    const apollo = new ApolloServer({
      typeDefs: [rootSchema, scalars, ...schemaTypes],
      resolvers: merge({}, scalarResolvers, userResolvers, deviceResolvers),
      context({ req }: { req: PRequest<any> }): Context {
        return {
          token: req.token,
          models
        };
      },
      tracing: isDev,
      playground: isDev,
      introspection: isDev
    });

    return apollo;
  } catch (e) {
    throw new Error(`Error occured while creating ApolloServer: ${e}`);
  }
};
