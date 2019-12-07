import { begin } from "../../../app";
import { disconnect } from "../../../db";
import resolvers from "../user.resolvers";
import { User, IUserDocument } from "../user.model";
import { Permission } from "../../permissions";
import {
  Authentication,
  AuthenticationMethod
} from "../../../types/authentication/authentication.model";
import { models } from "../../../db/models";

describe("user query resolvers", () => {
  let user1: IUserDocument;
  let user2: IUserDocument;
  it("currentUser", async () => {
    const user = await resolvers.Query.currentUser(null, null, {
      token: {
        user: {
          id: user1.id,
          permissions: user1.permissions
        }
      },
      models
    });

    expect(user._id).toStrictEqual(user1._id);
    expect(user.name).toBe("user1");

    // No current user -> error
    resolvers.Query.currentUser()
      .then(r => {
        console.log(r);
        fail("Resolver should have thrown an error");
      })
      .catch(err => {
        expect(err).toBeInstanceOf(Error);
      });
  });

  it("User.authentications", async () => {
    // Only owner or root can access User.authentications
    // Owner accesses
    const authentications1 = resolvers.User.authentications(user2, null, {
      token: {
        user: {
          id: user2.id,
          permissions: user2.permissions
        }
      },
      models
    });
    expect(authentications1).toHaveLength(1);
    expect(authentications1[0]).toMatchObject(user2.authentications[0]);

    // Root accesses
    const authentications2 = resolvers.User.authentications(user2, null, {
      token: {
        user: {
          id: user1.id,
          permissions: user1.permissions
        }
      },
      models
    });
    expect(authentications2).toHaveLength(1);
    expect(authentications2[0]).toMatchObject(user2.authentications[0]);

    // Error
    const authentications3 = () => {
      resolvers.User.authentications(user1, null, {
        token: {
          user: {
            id: user2.id,
            permissions: user2.permissions
          }
        },
        models
      });
    };
    expect(authentications3).toThrowError();
  });

  beforeAll(async () => {
    await begin();
    [user1, user2] = await User.create([
      {
        name: "user1",
        email: "user1@example.com",
        permissions: [Permission.ALL],
        authentications: [
          new Authentication({
            method: AuthenticationMethod.PASSWORD,
            payload: "123"
          })
        ]
      },
      {
        name: "user2",
        email: "user2@example.com",
        permissions: [],
        authentications: [
          new Authentication({
            method: AuthenticationMethod.PASSWORD,
            payload: "456"
          })
        ]
      }
    ]);
    // Create any required models
  });

  afterAll(async () => {
    await disconnect();
    // Remve any created models
  });
});
