import request from "supertest";
import { hashPassword } from "../password";
import { User } from "../../../types/user/user.model";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import { app, begin } from "../../../app";
import { verifyToken } from "../../../auth/jwt";
import config from "../../../config";
import { disconnect } from "../../../db";
import routes from "../../routes";

const req = request(app);
const LOGIN_ENDPOINT = routes["login/password"].path;
const cryptSecret = config.get("security:cryptSecret");

describe("password endpoint", () => {
  it("authenticates a valid user", async () => {
    const resp = await req
      .post(LOGIN_ENDPOINT)
      .send({ user: "user1", password: "1234" });
    expect(resp.status).toBe(200);

    expect(
      verifyTokenPair(resp.body.data.refreshToken, resp.body.data.accessToken)
    ).toBe(true);
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

  afterAll(async () => {
    await disconnect();
  });
});

export const verifyTokenPair = (
  refreshToken: string,
  accessToken: string
): boolean => {
  const [rValid, rBody]: [any, any] = verifyToken(cryptSecret, refreshToken);
  const [aValid, aBody]: [any, any] = verifyToken(cryptSecret, accessToken);
  return rValid && aValid && rBody.oid === aBody.roid;
};
