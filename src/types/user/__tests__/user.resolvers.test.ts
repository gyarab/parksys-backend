import { begin } from "../../../app";
import { disconnect } from "../../../db";
import resolvers from "../user.resolvers";
import { User, IUser, IUserDocument } from "../user.model";
import { Permission } from "../../permissions";

describe("user query resolvers", () => {
  it("currentUser", async () => {
    const userData: IUser = {
      name: "user1",
      email: "user1@example.com",
      permissions: [
        Permission.ALL
      ]
    };

    const dbUser: IUserDocument = (await User.create([userData]))[0];

    const user = await resolvers.Query.currentUser(null, null, {
      token: {
        user: {
          id: dbUser.id
        }
      }
    });

    expect(user._id).toStrictEqual(dbUser._id);
    expect(user.name).toBe("user1");
  });

  beforeAll(async () => {
    await begin();
    // Create any required models
  });

  afterAll(async () => {
    await disconnect();
    // Remve any created models
  });
});
