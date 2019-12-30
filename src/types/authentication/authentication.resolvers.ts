import { Resolver } from "../../db/gql";
import {
  authenticateUserWithPassword,
  verifyPasswordChangeArgs,
  changeUsersPassword
} from "../../auth/auth";

// Mutation
const passwordLogin: Resolver = async (_, { user, password }, ctx) => {
  const response = await authenticateUserWithPassword(
    user,
    password,
    ctx.models
  );
  return response;
};

const passwordChange: Resolver = async (_, { input }, ctx) => {
  const { newPassword, user: userId, currentPassword } = input; // Obligatory args
  const [valid, isAdmin, self, uId] = verifyPasswordChangeArgs({
    token: ctx.token,
    currentPassword,
    newPassword,
    userId
  });
  if (!valid) {
    throw new Error("Unable to change password");
  }
  const result = await changeUsersPassword(
    uId,
    currentPassword,
    newPassword,
    ctx.models,
    isAdmin
  );
  return result.toString();
};

export default {
  Mutation: {
    passwordLogin,
    passwordChange
  }
};
