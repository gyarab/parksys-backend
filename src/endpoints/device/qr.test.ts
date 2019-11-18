import request from "supertest";
import { Device } from "../../device/device.model";
import { app, begin } from "../../app";
import { disconnect } from "../../db";
import routes from "../routes";
import { createToken } from "../../auth/jwt";
import { Permission } from "../../permissions";
import config from "../../config";

const req = request(app);
const QR_ENDPOINT = name => routes["devices/qr"].path.replace(":name", name);

describe("qr endpoint", () => {
  it("should return an image", async () => {
    const resp = await req
      .get(QR_ENDPOINT("d1"))
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

  beforeAll(async () => {
    await begin();
    await Device.remove({});
    await Device.create([
      {
        name: "d1"
      }
    ]);
  });

  afterAll(async () => {
    await disconnect();
  });
});
