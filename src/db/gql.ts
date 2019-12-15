// Load schema types, create the ApolloServer
import { ApolloServer } from "apollo-server-express";
import _ from "lodash";
import path from "path";
import fs from "fs";
import userResolvers from "../types/user/user.resolvers";
import deviceResolvers from "../types/device/device.resolvers";
import vehicleFilterResolvers from "../types/parking/vehicleFilter.resolvers";
import parkingRuleResolvers from "../types/parking/parkingRule.resolvers";
import vehicleSelectorResolvers from "../types/parking/vehicleSelector.resolvers";
import vehicleResolvers from "../types/vehicle/vehicle.resolvers";
import authenticationResolvers from "../types/authentication/authentication.resolvers";
import { Permission } from "../types/permissions";
import { PRequest } from "../app";
import { resolvers as scalarResolvers } from "graphql-scalars";
import { Model } from "mongoose";
import { models } from "./models";
import { IUser } from "../types/user/user.model";
import { IDevice } from "../types/device/device.model";
import { IRefreshToken } from "../types/refreshToken/refreshToken.model";
import { IAuthentication } from "../types/authentication/authentication.model";
import gql from "graphql-tag";
import { IVehicleFilter } from "../types/parking/vehicleFilter.model";
import { IVehicleSelector } from "../types/parking/vehicleSelector.model";
import {
  IParkingRule,
  IParkingRuleTimedFee,
  IParkingRulePermitAccess
} from "../types/parking/parkingRule.model";
import { IVehicle } from "../types/vehicle/vehicle.model";

export type Context = Pick<PRequest<any>, "token"> & {
  models: {
    User: Model<IUser, {}>;
    Device: Model<IDevice, {}>;
    RefreshToken: Model<IRefreshToken, {}>;
    Authentication: Model<IAuthentication, {}>;
    VehicleFilter: Model<IVehicleFilter, {}>;
    ParkingRule: Model<IParkingRule, {}>;
    ParkingRuleTimedFee: Model<IParkingRuleTimedFee, {}>;
    ParkingRulePermitAccess: Model<IParkingRulePermitAccess, {}>;
    Vehicle: Model<IVehicle, {}>;
    VehicleSelector: Model<IVehicleSelector, {}>;
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

// Inspired by https://github.com/FrontendMasters/intro-to-graphql
const types = [
  "user",
  "refreshToken",
  "authentication",
  "device",
  "permissions",
  "parking",
  "vehicle",
  "time"
];

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

let typeDefs = null;

export const getTypeDefs = async () => {
  if (typeDefs === null) {
    const rootSchema = gql`
      type Query
      type Mutation
      schema {
        query: Query
        mutation: Mutation
      }
    `;
    const scalars: string = await loadSchemaScalars();
    const schemaTypes: string[] = await Promise.all(types.map(loadSchemaTypes));
    typeDefs = [rootSchema, scalars, ...schemaTypes];
  }
  return typeDefs;
};

export const resolvers = _.merge(
  {},
  scalarResolvers,
  userResolvers,
  deviceResolvers,
  vehicleResolvers,
  vehicleFilterResolvers,
  vehicleSelectorResolvers,
  parkingRuleResolvers,
  authenticationResolvers,
  {
    ParkingRuleSelector: {
      __resolveType() {
        return "ParkingRuleTimedFee";
      }
    }
  }
);

export const constructGraphQLServer = async ():
  | Promise<ApolloServer>
  | never => {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const tDefs = await getTypeDefs();
    const apollo = new ApolloServer({
      typeDefs: tDefs,
      resolvers: resolvers,
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
