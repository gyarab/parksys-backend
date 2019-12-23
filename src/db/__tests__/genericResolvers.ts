import {
  gqlCreate,
  ModelGetter,
  gqlFindByIdUpdate,
  gqlFindByIdDelete,
  gqlFindUsingFilter
} from "../genericResolvers";
import { Resolver } from "../gql";
import { connect, disconnect } from "../index";
import { User } from "../../types/user/user.model";
import { models } from "../models";

const user1 = {
  name: "user1",
  email: "user1@example.com"
};

const user2 = {
  name: "user2",
  email: "user2@example.com"
};

describe("generic resolvers", () => {
  const userModelGetter: ModelGetter = ctx => ctx.models.User;
  const userCreate: Resolver = gqlCreate(userModelGetter);
  const userUpdate: Resolver = gqlFindByIdUpdate(userModelGetter);
  const userDelete: Resolver = gqlFindByIdDelete(userModelGetter);
  const userFind: Resolver = gqlFindUsingFilter(userModelGetter);

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

  it("gqlFindUsingFilter - implicit all", async () => {
    await new User(user1).save();
    await new User(user2).save();
    const users = await userFind(null, {}, { models }, null);
    expect(users[0].toObject()).toMatchObject(user1);
    expect(users[1].toObject()).toMatchObject(user2);
    expect(users).toHaveLength(2);
  });

  afterEach(async () => Promise.all([User.remove({})]));
  afterAll(disconnect);
  beforeAll(connect);
});
