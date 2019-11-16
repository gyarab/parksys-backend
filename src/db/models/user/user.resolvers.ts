import { User } from "./user.model";
import lodash from "lodash";

const currentUser = async (_, args, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  if (uid) {
    return await User.findById(uid);
  }
  return null;
};

const users = async (_, args, ctx) => {
  if (lodash.get(ctx, "token.user.permissions", []).includes("ALL")) {
    const users = await User.find({});
    return users;
  }
  throw new Error("Unauthorized");
};

export default {
  Query: {
    currentUser,
    users
  },
  Mutation: {
    a() {
      return "asd";
    }
  }
};
