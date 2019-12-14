import { Resolver } from "../../db/gql";
import { authenticateUser } from "../../auth/auth";

// Mutation
const passwordLogin: Resolver = async (_, { user, password }, ctx) => {
  const response = await authenticateUser(user, password, ctx.models);
  return response;
};

export default {
  Mutation: {
    passwordLogin
  }
};
