import request from "supertest";
import { hashPassword } from "./password";
import { User } from "../../db/models/user/user.model";
import { AuthenticationMethod } from "../../db/models/authentication/authentication.model";
import { app, begin } from "../../app";
import { fromBase64Url, verifyToken } from "../../auth/jwt";
import config from "../../config";
import { disconnect } from "../../db";

const req = request(app);
const LOGIN_ENDPOINT = "/login/password";

describe("password endpoint", () => {
  beforeAll(async () => {
    await begin();
    await User.remove({});
    await new User({
      name: "user1",
      email: "user1@example.com",
      authentications: [
        {
          method: AuthenticationMethod.PASSWORD,
          payload: {
            h: hashPassword("1234", "NaCl"),
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
            h: hashPassword("5678", "KCl"),
            s: "KCl"
          }
        }
      ]
    }).save();
  });

  afterAll(async () => {
    await disconnect();
  });

  it("authenticates a valid user", async () => {
    const resp = await req
      .post(LOGIN_ENDPOINT)
      .send({ user: "user1", password: "1234" });
    expect(resp.status).toBe(200);
    expect(resp.body.refreshToken).toBeDefined;
    expect(resp.body.accessToken).toBeDefined;

    const getTokenData = token => {
      const parts = token.split(".");
      expect(parts.length).toBe(3);
      return JSON.parse(fromBase64Url(parts[1]));
    };
    const { refreshToken, accessToken } = resp.body.data;
    const rTokenData = getTokenData(refreshToken);
    const aTokenData = getTokenData(accessToken);
    // Tokens are bound with one another
    expect(aTokenData.roid).toBe(rTokenData.oid);
    // Tokens are valid
    expect(verifyToken(config.get("cryptSecret"), refreshToken)[0]).toBe(true);
    expect(verifyToken(config.get("cryptSecret"), accessToken)[0]).toBe(true);
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
});
