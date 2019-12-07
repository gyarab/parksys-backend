import { User, IUserDocument } from "./user.model";
import lodash from "lodash";
import { checkPermissionsGqlBuilder } from "../../auth/auth";
import { Permission } from "../permissions";
import { Resolver } from "../../db/gql";

// Query
const currentUser: Resolver = async (_, args, ctx) => {
  const uid = lodash.get(ctx, "token.user.id");
  if (!!uid) {
    const user = await User.findById(uid);
    return user == null ? null : user.toObject();
  }
  throw new Error("No current user");
};

const users: Resolver = async (_, { filter }) => {
  return await User.find(!!filter ? filter : {});
};

// User
const authentications: Resolver = (obj: IUserDocument, _, ctx) => {
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

export default {
  Query: {
    currentUser,
    users: checkPermissionsGqlBuilder([Permission.ALL], users)
  },
  User: {
    authentications
  }
};
