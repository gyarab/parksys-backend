import request from "supertest";
import { Device, IDeviceDocument } from "../../../types/device/device.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Permission } from "../../../types/permissions";
import { createTokenPair } from "../../../auth/auth";

const req = request(app);
const UPDATE_CONFIG_ENDPOINT = () => routes["devices/config"].path;

describe("updateConfig endpoint", () => {
  let d1Id = null;
  let validAccessToken = null;

  it("should fail", async () => {
    const resp = await req
      .put(UPDATE_CONFIG_ENDPOINT())
      .set("Authentication", `Bearer ${validAccessToken}`)
      .send({
        config: "string"
      });
    expect(resp.status).toBe(400);
    // Verify DB - should stay the same
    const device = await Device.findById(d1Id);
    expect(device.config).toMatchObject({
      key1: "value1",
      key2: [1, 2, 3]
    });
  });

  it("should work", async () => {
    const resp = await req
      .put(UPDATE_CONFIG_ENDPOINT())
      .set("Authentication", `Bearer ${validAccessToken}`)
      .send({
        config: {
          key1: "value2",
          key2: [1, 2]
        }
      });
    expect(resp.status).toBe(200);
    // Verify DB
    const device = await Device.findById(d1Id);
    expect(device.config).toMatchObject({
      key1: "value2",
      key2: [1, 2]
    });
  });

  beforeAll(async () => {
    await begin();
    const devices: IDeviceDocument[] = await Device.create([
      {
        name: "d1",
        shouldSendConfig: true,
        activated: true,
        config: {
          key1: "value1",
          key2: [1, 2, 3]
        }
      }
    ]);
    d1Id = devices[0].id;
    const tokens = await createTokenPair({
      device: {
        id: d1Id,
        permissions: [Permission.ALL]
      }
    });
    validAccessToken = tokens.accessToken;
    devices[0].refreshToken = tokens.refreshToken.obj;
    await devices[0].save();
  });

  afterAll(async () => {
    await disconnect();
  });
});