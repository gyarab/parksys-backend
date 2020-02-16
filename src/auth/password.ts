import config from "../config";
import { Permission } from "../types/permissions";
import lodash from "lodash";
import { IRefreshToken } from "../types/refreshToken/refreshToken.model";
import { Model } from "mongoose";
import {
  AuthenticationMethod,
  IAuthentication,
  IAuthenticationPayloadPassword,
  Authentication
} from "../types/authentication/authentication.model";
import { IUser } from "../types/user/user.model";
import { hashPassword, createSalt } from "./passwordUtils";
import {
  AccessTokenData,
  createTokenPair,
  userAccessTokenData
} from "./tokenUtils";

const usersFaultMessage = "Unable to authenticate";
type UserModel = Model<IUser, {}>;

const userByIdWithPasswordAuthentications = async (
  userId: string,
  userModel: UserModel,
  errMsg = usersFaultMessage
): Promise<IUser> => {
  const user = await userModel.findOne({
    _id: userId,
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } },
    active: true
  });
  if (!user) throw new Error(errMsg);
  return user;
};

const userByUsernameWithPasswordAuthentications = async (
  username: string,
  userModel: UserModel,
  errMsg = usersFaultMessage
): Promise<IUser> => {
  const user = await userModel.findOne({
    $or: [{ name: username }, { email: username }],
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } },
    active: true
  });
  if (!user) throw new Error(errMsg);
  return user;
};

const isPasswordCorrect = async (
  auth: IAuthentication<IAuthenticationPayloadPassword>,
  suppliedPassword: string
) => {
  if (!auth.payload.hasOwnProperty("h") || !auth.payload.hasOwnProperty("s")) {
    throw new Error(
      "PASSWORD authentication for user should have h and s props"
    );
  }
  const { s: salt, h: dbHash } = auth.payload;

  const hashResult = await hashPassword(suppliedPassword, salt);
  return dbHash === hashResult;
};

const onlyPasswordAuths = (
  user: IUser
): Array<[IAuthentication<IAuthenticationPayloadPassword>, number]> => {
  const withOriginalIndices: Array<
    [IAuthentication<IAuthenticationPayloadPassword>, number]
  > = user.authentications.map((auth, originalI) => [auth, originalI]);
  return withOriginalIndices.filter(
    ([auth, i]) => auth.method === AuthenticationMethod.PASSWORD
  );
};

export const authenticateUserWithPassword = async (
  username: string,
  suppliedPassword: string,
  models: { User: Model<IUser, {}>; RefreshToken: Model<IRefreshToken, {}> }
): Promise<any> => {
  const user = await userByUsernameWithPasswordAuthentications(
    username,
    models.User
  );
  for (const [auth, _] of onlyPasswordAuths(user)) {
    if (await isPasswordCorrect(auth, suppliedPassword)) {
      // Authenticated
      const aTokenData: AccessTokenData = userAccessTokenData({
        id: user.id,
        permissions: user.permissions
      });
      const {
        accessToken: { str: accessToken },
        refreshToken: {
          str: refreshToken,
          obj: refreshTokenObj,
          db: refreshTokenDb
        }
      } = await createTokenPair(
        aTokenData,
        { method: AuthenticationMethod.PASSWORD },
        models.RefreshToken
      );
      user.refreshTokens.push(refreshTokenDb);
      await user.save();

      return {
        refreshToken,
        accessToken,
        user
      };
    }
  }
  throw new Error("Unable to authenticate");
};

const hashSaltMemo = (password: string) => {
  let result = null;
  return async () => {
    if (result === null) {
      const salt = await createSalt();
      const hash = await hashPassword(password, salt);
      result = { hash, salt };
    }
    return result;
  };
};

export const verifyPasswordChangeArgs = ({
  token,
  currentPassword,
  newPassword,
  userId
}): [boolean, boolean, boolean, string] => {
  const isString = (s: any) => typeof s === "string";
  const isUser = lodash.get(token, "user", null) !== null;
  const isAdmin = lodash
    .get(token, "user.permissions", [])
    .includes(Permission.ALL);
  const self = userId === lodash.get(token, "user.id", 0) || !userId;
  const allowedStates = () => {
    return (
      (self && !!currentPassword && isString(currentPassword)) ||
      (isAdmin && !!userId && isString(userId))
    );
  };
  const valid =
    !!token &&
    !!newPassword &&
    isString(newPassword) &&
    !!isUser && // Only a user can do this
    allowedStates();
  const uId = self ? lodash.get(token, "user.id") : userId;
  return [valid, isAdmin, self, uId];
};

const passwordChangeUsersFault = "Unable to change password";
export const changeUsersPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  models: { User: Model<IUser, {}> },
  isAdmin: boolean = false
) => {
  const user = await userByIdWithPasswordAuthentications(
    userId,
    models.User,
    passwordChangeUsersFault
  );
  const hashSalt = hashSaltMemo(newPassword);
  let nChanged = 0;
  // Change every matching auth - currently only one is supported though
  for (const [auth, i] of onlyPasswordAuths(user)) {
    if (isAdmin || (await isPasswordCorrect(auth, currentPassword))) {
      const { hash, salt } = await hashSalt(); // computed only once
      const authPayload: IAuthenticationPayloadPassword = {
        h: hash,
        s: salt
      };
      user.authentications[i] = new Authentication({
        method: AuthenticationMethod.PASSWORD,
        payload: authPayload
      });
      nChanged++;
    }
  }
  if (nChanged > 0) {
    // Ok
    await user.save();
    return nChanged;
  } else {
    throw new Error(passwordChangeUsersFault);
  }
};
