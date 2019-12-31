import { IUser } from "./user.model";
import lodash from "lodash";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { Resolver } from "../../db/gql";
import { gqlFindUsingFilter, ModelGetter } from "../../db/genericResolvers";

const modelGetter: ModelGetter<IUser> = ctx => ctx.models.User;

// Query
const currentUser: Resolver = async (_, __, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  if (!!uid) {
    const user = await ctx.models.User.findById(uid);
    if (!user) throw new Error("User no longer exists");
    return user;
  }
  throw new Error("No current user");
};

const users: Resolver = gqlFindUsingFilter(modelGetter);

// User
const authentications: Resolver = (obj: IUser, _, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  const permissions: Array<String> = lodash.get(
    ctx,
    "token.user.permissions",
    []
  );
  if (uid === obj._id.toString() || permissions.includes(Permission.ALL)) {
    return obj.authentications;
  } else {
    throw new Error("Only owner and root can request authentications");
  }
};

const isAdmin: Resolver = (obj: IUser) => {
  return obj.permissions.indexOf(Permission.ALL) >= 0;
};

export default {
  Query: {
    currentUser,
    users: checkPermissionsGqlBuilder([Permission.ALL], users)
  },
  User: {
    authentications,
    isAdmin
  }
};
