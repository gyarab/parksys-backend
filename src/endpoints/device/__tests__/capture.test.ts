import request from "supertest";
import { Device, IDeviceDocument } from "../../../types/device/device.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Permission } from "../../../types/permissions";
import { createTokenPair } from "../../../auth/auth";
import path from "path";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);
const req = request(app);
const CAPTURE_ENDPOINT = () => routes["devices/capture"].path;

describe("capture endpoint", () => {
  let validAccessToken = null;
  it("should return config", async () => {
    const resp = await req
      .post(CAPTURE_ENDPOINT())
      .attach("capture_" + new Date().getTime(), testImagePath)
      .set("Authorization", `Bearer ${validAccessToken}`);
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchObject({
      data: {
        config: {
          key1: "value1",
          key2: [1, 2, 3]
        }
      }
    });
    // TODO: Test that the capture has been recorded
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
    const tokens = await createTokenPair(
      {
        device: {
          id: devices[0].id,
          permissions: [Permission.ALL]
        }
      },
      {
        method: AuthenticationMethod.TEST
      }
    );
    validAccessToken = tokens.accessToken;
    devices[0].refreshToken = tokens.refreshToken.obj;
    await devices[0].save();
  });

  afterAll(async () => {
    await disconnect();
  });
});
