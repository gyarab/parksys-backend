import { User } from "./user.model";
import lodash from "lodash";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { Resolver } from "../../db/gql";

const currentUser: Resolver = async (_, args, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  if (uid) {
    const user = await User.findById(uid);
    return user == null ? null : user.toObject();
  }
  return null;
};

const users: Resolver = async (_, args, ctx) => {
  return await User.find({});
};

export default {
  Query: {
    currentUser,
    users: checkPermissionsGqlBuilder([Permission.ALL], users)
  }
};
