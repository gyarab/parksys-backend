import { IUser } from "./user.model";
import lodash from "lodash";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";
import { Permission } from "../permissions";
import { Resolver } from "../../db/gql";
import {
  ModelGetter,
  gqlRegexSearch,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
} from "../../db/genericResolvers";

const modelGetter: ModelGetter<IUser> = (ctx) => ctx.models.User;

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

const userSearch: Resolver = gqlRegexSearch(
  modelGetter,
  "name",
  { max: 100, default: 50 },
  false,
  { name: 1 }
);

const userSearchByEmail: Resolver = gqlRegexSearch(
  modelGetter,
  "email",
  { max: 100, default: 50 },
  false,
  { name: 1 }
);

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

// Mutation
const _updateUser: Resolver = gqlFindByIdUpdate(modelGetter);
const updateUser: Resolver = async (obj, args, ctx, info) => {
  if (args.input.active === false && ctx.token.user.id === args.id) {
    throw new Error("Cannot deactive yourself.");
  }
  if (
    isAdmin(ctx.token.user) &&
    !isAdmin({ permissions: args.input.permissions || [Permission.ALL] })
  ) {
    throw new Error("Cannot deadmin yourself,");
  }
  return await _updateUser(obj, args, ctx, info);
};

const _deleteUser: Resolver = gqlFindByIdDelete(modelGetter);
const deleteUser: Resolver = async (obj, args, ctx, info) => {
  if (ctx.token.user.id === args.id) {
    throw Error("Cannot delete yourself.");
  }
  return _deleteUser(obj, args, ctx, info);
};

export default {
  Query: {
    currentUser,
    userSearch: checkPermissionsGqlBuilder([Permission.ALL], userSearch),
    userSearchByEmail: checkPermissionsGqlBuilder(
      [Permission.ALL],
      userSearchByEmail
    ),
  },
  User: {
    authentications,
    isAdmin,
  },
  Mutation: {
    updateUser: checkPermissionsGqlBuilder([Permission.ALL], updateUser),
    deleteUser: checkPermissionsGqlBuilder([Permission.ALL], deleteUser),
  },
};
