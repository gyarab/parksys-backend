import request from "supertest";
import { hashPassword } from "../password";
import { User } from "../../../user/user.model";
import { AuthenticationMethod } from "../../../authentication/authentication.model";
import { app, begin } from "../../../app";
import { fromBase64Url, verifyToken } from "../../../auth/jwt";
import config from "../../../config";
import { disconnect } from "../../../db";
import routes from "../../routes";

const req = request(app);
const LOGIN_ENDPOINT = routes["login/password"].path;

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

  beforeAll(async () => {
    await begin();
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
    await User.remove({});
    await disconnect();
  });
});

export const verifyTokenPair = (
  refreshToken: string,
  accessToken: string
): boolean => {
  const [rValid, rBody] = verifyToken(config.get("cryptSecret"), refreshToken);
  const [aValid, aBody] = verifyToken(config.get("cryptSecret"), accessToken);
  return rValid && aValid && rBody.oid === aBody.roid;
};
