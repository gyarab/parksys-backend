import request from "supertest";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Device, IDevice } from "../../../types/device/device.model";
import { verifyTokenPair } from "../../login/__tests__/password.test";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import lodash from "lodash";
import config from "../../../config";
import { verifyToken } from "../../../auth/jwt";

const req = request(app);
const ACTIVATION_ENDPOINT = () => routes["devices/activate"].path;
const cryptSecret = config.get("security:cryptSecret");

describe("password activation endpoint", () => {
  let d1Pass = null;
  let d2Pass = null;
  it("should accept a valid activation password", async () => {
    const resp = await req.post(ACTIVATION_ENDPOINT()).send({
      activationPassword: d1Pass
    });
    expect(resp.status).toBe(200);

    const { refreshToken, accessToken, device: respDevice } = resp.body.data;
    expect(verifyTokenPair(refreshToken, accessToken)).toBe(true);

    // Check the accessToken body
    const [_, accessTokenBody] = verifyToken(cryptSecret, accessToken);
    expect(lodash.get(accessTokenBody, "device.id", undefined)).toBeDefined();
    expect(
      lodash.get(accessTokenBody, "device.permissions", undefined)
    ).toBeDefined();

    // Check the refreshToken body
    const [__, refreshTokenBody] = verifyToken(cryptSecret, refreshToken);
    expect(lodash.get(refreshTokenBody, "method")).toBe(
      AuthenticationMethod.ACTIVATION_PASSWORD
    );

    // Device should be active now
    expect(respDevice.activated).toBe(true);
    // Date validity
    expect(new Date(respDevice.activatedAt).getTime()).not.toBeNaN();
    expect(respDevice.refreshToken).toBeUndefined();
    expect(respDevice.activationPassword).toBeUndefined();
    const dbDevice: IDevice = await Device.findById(respDevice.id);
    expect(dbDevice.activated).toBe(true);
  });

  it("should not accept a used activation password", async () => {
    const resp = await req.post(ACTIVATION_ENDPOINT()).send({
      activationPassword: d1Pass
    });
    expect(resp.status).toBe(401);
  });

  it("should not accept a timeouted activation password", async () => {
    const resp = await req.post(ACTIVATION_ENDPOINT()).send({
      activationPassword: d2Pass
    });
    expect(resp.status).toBe(401);
  });

  beforeAll(async () => {
    await begin();
    // Create any required models
    const devices: IDevice[] = await Device.create([
      {
        name: "d1"
      },
      {
        name: "d2",
        activationPassword: {
          payload: {
            password: "1234567890",
            expiresAt: new Date(new Date().getTime() - 1) // now - 1ms
          },
          method: AuthenticationMethod.ACTIVATION_PASSWORD
        }
      }
    ]);
    d1Pass = devices[0].activationPassword.payload["password"];
    d2Pass = devices[1].activationPassword.payload["password"];
  });

  afterAll(async () => {
    await disconnect();
  });
});
