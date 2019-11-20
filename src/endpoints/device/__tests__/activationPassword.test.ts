import request from "supertest";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Device, IDeviceDocument } from "../../../types/device/device.model";
import { verifyTokenPair } from "../../login/__tests__/password.test";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";

const req = request(app);
const ACTIVATION_ENDPOINT = () => routes["devices/activate"].path;

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
    // Device should be active now
    expect(respDevice.activated).toBe(true);
    expect(respDevice.refreshToken).toBeUndefined;
    const dbDevice: IDeviceDocument = await Device.findById(respDevice._id);
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
    const devices: IDeviceDocument[] = await Device.create([
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
    // Remove any created models
    await Device.remove({});
    await disconnect();
  });
});
