import request from "supertest";
import { Device } from "../../../types/device/device.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { createToken } from "../../../auth/jwt";
import { Permission } from "../../../types/permissions";
import config from "../../../config";

const req = request(app);
const QR_ENDPOINT = id => routes["devices/qr"].path.replace(":id", id);

describe("qr endpoint", () => {
  let d1Id = null;
  it("should return an image", async () => {
    const resp = await req
      .get(QR_ENDPOINT(d1Id))
      .set(
        "Authentication",
        `Bearer ${createToken(config.get("cryptSecret"), {
          user: {
            permissions: [Permission.ALL]
          }
        })}`
      )
      .send();
    expect(resp.status).toBe(200);
    // TODO: Better check
    expect(resp.text.length).toBeGreaterThan(0);
  });

  it("should not crash", async () => {
    let resp = await req
      .get(QR_ENDPOINT("5dd00z009b3e507dffba8b33"))
      .set(
        "Authentication",
        `Bearer ${createToken(config.get("cryptSecret"), {
          user: {
            permissions: [Permission.ALL]
          }
        })}`
      )
      .send();
    expect(resp.status).toBe(400);
    resp = await req
      .get(QR_ENDPOINT("5dd000009b3e507dffba8b33"))
      .set(
        "Authentication",
        `Bearer ${createToken(config.get("cryptSecret"), {
          user: {
            permissions: [Permission.ALL]
          }
        })}`
      )
      .send();
    expect(resp.status).toBe(400);
  });

  beforeAll(async () => {
    await begin();
    const d1 = await Device.create([
      {
        name: "d1"
      }
    ]);
    d1Id = d1[0]._id.toString();
    if (d1Id == null) fail("Unable to create mock device");
  });

  afterAll(async () => {
    await Device.remove({});
    await disconnect();
  });
});
