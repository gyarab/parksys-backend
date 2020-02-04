import request from "supertest";
import { User } from "../../../types/user/user.model";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import { app, begin } from "../../../app";
import { verifyToken, verifyTokenPair } from "../../../auth/jwt";
import config from "../../../config";
import { disconnect } from "../../../db";
import routes from "../../routes";
import lodash from "lodash";
import { hashPassword } from "../../../auth/passwordUtils";

const req = request(app);
const LOGIN_ENDPOINT = routes["login/password"].path;
const cryptSecret = config.get("security:cryptSecret");

describe("password endpoint", () => {
  it("authenticates a valid user", async () => {
    const resp = await req
      .post(LOGIN_ENDPOINT)
      .send({ user: "user1", password: "1234" });
    expect(resp.status).toBe(200);

    const { refreshToken, accessToken, user } = resp.body.data;

    expect(verifyTokenPair(refreshToken, accessToken, cryptSecret)).toBe(true);
    expect(user.authentications[0].payload).toBeUndefined();

    // Check the accessToken body
    const [_, accessTokenBody] = verifyToken(cryptSecret, accessToken);
    expect(lodash.get(accessTokenBody, "user.id", undefined)).toBeDefined();
    expect(
      lodash.get(accessTokenBody, "user.permissions", undefined)
    ).toBeDefined();

    // Check the refreshToken body
    const [__, refreshTokenBody] = verifyToken(cryptSecret, refreshToken);
    expect(lodash.get(refreshTokenBody, "method")).toBe(
      AuthenticationMethod.PASSWORD
    );
    expect(user.name).toBe("user1");
  });

  it("does not authenticate invalid users", async () => {
    let resp = await req.post(LOGIN_ENDPOINT).send({
      user: "user2",
      password: "abcd"
    });
    expect(resp.status).toBe(401);

    resp = await req.post(LOGIN_ENDPOINT).send({
      user: "noone",
      password: "1234"
    });
    expect(resp.status).toBe(401);
  });

  it("empty request yields 401", async () => {
    const resp = await req.post(LOGIN_ENDPOINT).send({});
    expect(resp.status).toBe(401);
  });

  beforeAll(async () => {
    await begin();
    await new User({
      name: "user1",
      email: "user1@example.com",
      authentications: [
        {
          method: AuthenticationMethod.PASSWORD,
          payload: {
            h: await hashPassword("1234", "NaCl"),
            s: "NaCl"
          }
        }
      ]
    }).save();
    await new User({
      name: "user2",
      email: "user2@example.com",
      authentications: [
        {
          method: AuthenticationMethod.PASSWORD,
          payload: {
            h: await hashPassword("5678", "KCl"),
            s: "KCl"
          }
        }
      ]
    }).save();
  });

  afterAll(disconnect);
});
