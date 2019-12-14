import request from "supertest";
import { Device } from "../../../types/device/device.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Permission } from "../../../types/permissions";
import { createTokenPair } from "../../../auth/auth";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import { RefreshToken } from "../../../types/refreshToken/refreshToken.model";

const req = request(app);
const QR_ENDPOINT = id => routes["devices/qr"].path.replace(":id", id);

describe("qr endpoint", () => {
  let d1Id = null;
  let validAccessToken = null;
  it("should return an image", async () => {
    const resp = await req
      .get(QR_ENDPOINT(d1Id))
      .set("Authorization", `Bearer ${validAccessToken}`)
      .send();
    expect(resp.status).toBe(200);
    // TODO: Better check
    expect(resp.text.length).toBeGreaterThan(0);
  });

  it("should not crash", async () => {
    let resp = await req
      .get(QR_ENDPOINT("5dd00z009b3e507dffba8b33"))
      .set("Authorization", `Bearer ${validAccessToken}`)
      .send();
    expect(resp.status).toBe(400);
    resp = await req
      .get(QR_ENDPOINT("5dd000009b3e507dffba8b33"))
      .set("Authorization", `Bearer ${validAccessToken}`)
      .send();
    expect(resp.status).toBe(400);
    resp = await req
      .get(QR_ENDPOINT(d1Id))
      .set("Authorization", `Bearer ASD`)
      .send();
    expect(resp.status).toBe(403);
  });

  beforeAll(async () => {
    await begin();
    validAccessToken = (await createTokenPair(
      {
        user: {
          id: "",
          permissions: [Permission.ALL]
        }
      },
      { method: AuthenticationMethod.TEST },
      RefreshToken
    )).accessToken;
    const d1 = await Device.create([
      {
        name: "d1"
      }
    ]);
    d1Id = d1[0]._id.toString();
  });

  afterAll(async () => {
    await disconnect();
  });
});
