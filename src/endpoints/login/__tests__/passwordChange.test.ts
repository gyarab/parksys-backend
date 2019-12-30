import request from "supertest";
import { User, IUser } from "../../../types/user/user.model";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { hashPassword, createTokenPair } from "../../../auth/auth";
import { Permission } from "../../../types/permissions";
import { RefreshToken } from "../../../types/refreshToken/refreshToken.model";

const req = request(app);
const PASSOWORD_CHANGE_ENDPOINT = routes["login/password"].path;

describe("password change endpoint", () => {
  let admin: IUser = null;
  let regUser1: IUser = null;
  let regUser2: IUser = null;
  let validAccessTokenAdmin = null;
  let validAccessTokenRegUser = null;

  it("change by admin", async () => {
    const resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenAdmin}`)
      .send({ userId: regUser1.id, newPassword: "qwerty" });
    expect(resp.status).toBe(200);
    const dbRegUser = await User.findById(regUser1.id);
    expect(dbRegUser.authentications[0].toObject()).not.toMatchObject(
      regUser1.authentications[0].toObject()
    );
  });

  it("change by self", async () => {
    // Admin
    let resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenAdmin}`)
      .send({ currentPassword: "1234", newPassword: "qwerty" });
    expect(resp.status).toBe(200);
    const dbAdminUser = await User.findById(regUser1.id);
    expect(dbAdminUser.authentications[0].toObject()).not.toMatchObject(
      admin.authentications[0].toObject()
    );
    expect(dbAdminUser.authentications).toHaveLength(1);
    // User
    resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenRegUser}`)
      .send({ currentPassword: "5678", newPassword: "qwerty" });
    expect(resp.status).toBe(200);
    const dbRegUser = await User.findById(regUser1.id);
    expect(dbRegUser.authentications[0].toObject()).not.toMatchObject(
      regUser1.authentications[0].toObject()
    );
    expect(dbRegUser.authentications).toHaveLength(1);
  });

  it("regular user can't change someone else's password", async () => {
    // User3
    let resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenRegUser}`)
      .send({ userId: regUser2.id, newPassword: "qwerty" });
    expect(resp.status).toBe(400);
    const dbRegUser2 = await User.findById(regUser2.id);
    expect(dbRegUser2.authentications[0].toObject()).toMatchObject(
      regUser2.authentications[0].toObject()
    );
    expect(dbRegUser2.authentications).toHaveLength(1);
    // Admin
    resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenRegUser}`)
      .send({ userId: admin.id, newPassword: "qwerty" });
    expect(resp.status).toBe(400);
    const dbAdmin = await User.findById(admin.id);
    expect(dbAdmin.authentications[0].toObject()).toMatchObject(
      admin.authentications[0].toObject()
    );
    expect(dbAdmin.authentications).toHaveLength(1);
  });

  it("invalid inputs", async () => {
    let resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenAdmin}`)
      .send({ newPassword: "1111" });
    expect(resp.status).toBe(400);

    resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenAdmin}`)
      .send({});
    expect(resp.status).toBe(400);

    resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenAdmin}`)
      .send({ userId: null, newPassword: "1111" });
    expect(resp.status).toBe(400);

    resp = await req
      .put(PASSOWORD_CHANGE_ENDPOINT)
      .set("Authorization", `Bearer ${validAccessTokenRegUser}`)
      .send({ userId: {}, newPassword: "1111" });
    expect(resp.status).toBe(400);

    const dbAdmin = await User.findById(admin.id);
    const dbRegUser1 = await User.findById(regUser1.id);
    const dbRegUser2 = await User.findById(regUser2.id);

    expect(dbAdmin.authentications[0].toObject()).toMatchObject(
      admin.authentications[0].toObject()
    );
    expect(dbRegUser1.authentications[0].toObject()).toMatchObject(
      regUser1.authentications[0].toObject()
    );
    expect(dbRegUser2.authentications[0].toObject()).toMatchObject(
      regUser2.authentications[0].toObject()
    );

    expect(dbAdmin.authentications).toHaveLength(1);
    expect(dbRegUser1.authentications).toHaveLength(1);
    expect(dbRegUser2.authentications).toHaveLength(1);
  });

  beforeAll(begin);

  afterEach(async () => await Promise.all([User.remove({})]));
  beforeEach(async () => {
    [admin, regUser1, regUser2] = await User.create([
      {
        name: "admin",
        email: "admin@example.com",
        permissions: [Permission.ALL],
        authentications: [
          {
            method: AuthenticationMethod.PASSWORD,
            payload: {
              h: await hashPassword("1234", "NaCl"),
              s: "NaCl"
            }
          }
        ]
      },
      {
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
      },
      {
        name: "user3",
        email: "user3@example.com",
        authentications: [
          {
            method: AuthenticationMethod.PASSWORD,
            payload: {
              h: await hashPassword("0000", "CuSO4"),
              s: "CuSO4"
            }
          }
        ]
      }
    ]);
    validAccessTokenAdmin = (await createTokenPair(
      {
        user: {
          id: admin.id,
          permissions: admin.permissions
        }
      },
      { method: AuthenticationMethod.TEST },
      RefreshToken
    )).accessToken;
    validAccessTokenRegUser = (await createTokenPair(
      {
        user: {
          id: regUser1.id,
          permissions: regUser1.permissions
        }
      },
      { method: AuthenticationMethod.TEST },
      RefreshToken
    )).accessToken;
  });

  afterAll(disconnect);
});
