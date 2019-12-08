import { makeExecutableSchema } from "graphql-tools";
import { getTypeDefs, resolvers } from "../db/gql";
import { graphql } from "graphql";

// TODO: Fix for integration tests
export const runQuery = async (query, ctx = {}, variables = {}) => {
  const schema = makeExecutableSchema({
    typeDefs: await getTypeDefs(),
    resolvers: resolvers
  });
  return graphql(schema, query, null, { ...ctx }, variables);
};
