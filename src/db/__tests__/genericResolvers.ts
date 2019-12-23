import {
  gqlCreate,
  ModelGetter,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter,
  gqlPopulate
} from "../genericResolvers";
import { Resolver } from "../gql";
import { connect, disconnect } from "../index";
import { User, IUser } from "../../types/user/user.model";
import { models } from "../models";
import { createTokenPair } from "../../auth/auth";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import {
  RefreshToken,
  IRefreshToken
} from "../../types/refreshToken/refreshToken.model";

const user1 = {
  name: "user1",
  email: "user1@example.com"
};

const user2 = {
  name: "user2",
  email: "user2@example.com"
};

describe("generic resolvers", () => {
  const userModelGetter: ModelGetter<IUser> = ctx => ctx.models.User;
  const userCreate: Resolver = gqlCreate(userModelGetter);
  const userUpdate: Resolver = gqlFindByIdUpdate(userModelGetter);
  const userDelete: Resolver = gqlFindByIdDelete(userModelGetter);
  const userFind: Resolver = gqlFindUsingFilter(userModelGetter);
  const userPopulateRefreshTokens: Resolver = gqlPopulate(
    userModelGetter,
    "refreshTokens"
  );

  it("gqlCreate", async () => {
    const user = await userCreate(null, { input: user1 }, { models }, null);
    const dbUser = await User.findById(user.id);
    expect(user.toObject()).toMatchObject(dbUser.toObject());
  });

  it("gqlFindByIdUpdate", async () => {
    const dbUser = await new User(user1).save();
    const user = await userUpdate(
      null,
      {
        id: dbUser._id.toString(),
        input: {
          email: "user1@zumbeispiel.de"
        }
      },
      { models },
      null
    );
    expect(user.toObject()).toMatchObject({
      name: "user1",
      email: "user1@zumbeispiel.de"
    });
  });

  it("gqlFindByIdDelete", async () => {
    const dbUser = await new User(user1).save();
    const user = await userDelete(
      null,
      {
        id: dbUser._id.toString()
      },
      { models },
      null
    );
    expect(user.toObject()).toMatchObject(dbUser.toObject());
    const dbUserRefetch = await User.findById(dbUser._id.toString());
    expect(dbUserRefetch).toBeNull();
  });

  it("gqlFindUsingFilter - with filter", async () => {
    const dbUser = await new User(user1).save();
    const users = await userFind(
      null,
      { filter: { name: user1.name } },
      { models },
      null
    );
    expect(users).toHaveLength(1);
    expect(users[0].toObject()).toMatchObject(dbUser.toObject());
  });

  it("gqlFindUsingFilter - implicitly all", async () => {
    await new User(user1).save();
    await new User(user2).save();
    const users = await userFind(null, {}, { models }, null);
    expect(users[0].toObject()).toMatchObject(user1);
    expect(users[1].toObject()).toMatchObject(user2);
    expect(users).toHaveLength(2);
  });

  it("gqlPopulate - not populated", async () => {
    const {
      refreshToken: { obj: refreshTokenObj }
    } = await createTokenPair(
      {},
      { method: AuthenticationMethod.TEST },
      RefreshToken
    );
    const user = await new User({
      ...user1,
      refreshTokens: [refreshTokenObj]
    }).save();
    const dbPopulatedUser: IUser = await User.populate(user, {
      path: "refreshTokens"
    });

    const refreshTokens: Array<IRefreshToken> = await userPopulateRefreshTokens(
      user,
      {},
      { models },
      null
    );
    expect(dbPopulatedUser.toObject()).toMatchObject({
      ...user1,
      refreshTokens: refreshTokens.map(r => r.toObject())
    });
  });

  it("gqlPopulate - already populated", async () => {
    const {
      refreshToken: { obj: refreshTokenObj }
    } = await createTokenPair(
      {},
      { method: AuthenticationMethod.TEST },
      RefreshToken
    );
    const user = await new User({
      ...user1,
      refreshTokens: [refreshTokenObj]
    }).save();
    const dbPopulatedUser: IUser = await User.populate(user, {
      path: "refreshTokens"
    });

    await disconnect();
    const refreshTokens: Array<IRefreshToken> = await userPopulateRefreshTokens(
      dbPopulatedUser,
      {},
      { models },
      null
    );
    expect(dbPopulatedUser.toObject()).toMatchObject({
      ...user1,
      refreshTokens: refreshTokens.map(r => r.toObject())
    });
    await connect();
  });

  afterEach(async () =>
    Promise.all([User.remove({}), RefreshToken.remove({})])
  );
  afterAll(disconnect);
  beforeAll(connect);
});
