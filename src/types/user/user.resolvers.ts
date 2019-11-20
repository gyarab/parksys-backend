import { User } from "./user.model";
import lodash from "lodash";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";

const currentUser = async (_, args, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  if (uid) {
    return (await User.findById(uid)).toObject();
  }
  return null;
};

const users = async (_, args, ctx) => {
  return await User.find({});
};

export default {
  Query: {
    currentUser,
    users: checkPermissionsGqlBuilder([Permission.ALL], users)
  },
  Mutation: {
    a() {
      return "asd";
    }
  }
};
