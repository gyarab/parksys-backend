import resolvers from "../device.resolvers";
import { Device, IDevice } from "../device.model";
import { Permission } from "../../../types/permissions";
import { models } from "../../../db/models";
import { Context } from "../../../db/gql";
import routes from "../../../endpoints/routes";
import { disconnect, connect } from "../../../db";
import gql from "graphql-tag";
import { runQuery } from "../../../utils/testRunGqlQuery";

describe("device resolvers", () => {
  const ctx: Context = {
    token: {
      user: {
        id: "",
        permissions: [Permission.ALL]
      }
    },
    models
  };
  let d1: IDevice = null;

  it("Query.device(filter)", async () => {
    const devices = await resolvers.Query.devices(
      null,
      { filter: { name: "d1" } },
      ctx,
      null
    );
    expect(devices).toHaveLength(1);
    expect(devices[0].name).toBe("d1");
    expect(devices[0].id).toBe(d1.id);

    expect(
      await resolvers.Query.devices(
        null,
        { filter: { activated: true } },
        ctx,
        null
      )
    ).toStrictEqual([]);
  });

  it.skip("run Query.device(filter)", async () => {
    const query = gql`
      query device($filter: DeviceFilter!) {
        device(filter: $filter) {
          id
          name
        }
      }
    `;
    const result = await runQuery(
      query,
      {
        models: {
          Device
        }
      },
      { name: "d1" }
    );
    console.log(result);
  });

  it("Query.createDevice(input)", async () => {
    const res = (await resolvers.Mutation.createDevice(
      null,
      {
        input: {
          name: "d2"
        }
      },
      ctx,
      null
    )).toJSON();
    expect(res.id).toBeDefined();
    expect(res.name).toBe("d2");

    const dbDevice = await Device.findById(res.id);
    expect(dbDevice.name).toBe("d2");
    expect(dbDevice).toMatchObject(res);
  });

  it("Mutation.deviceRegenerateActivationPassword", async () => {
    const resp = (await resolvers.Mutation.deviceRegenerateActivationPassword(
      null,
      { id: d1.id },
      ctx,
      null
    )).toJSON();
    // Activation password should not be returned
    expect(resp.activated).toBe(false);
    // Verify DB
    const d1Db = await Device.findById(d1.id);
    expect(d1Db.activationPassword).not.toMatchObject(d1.activationPassword);
    expect(d1Db.activated).toBe(false);
    expect(d1Db.refreshToken).toBeNull();
    expect(d1Db.activatedAt).toBeNull();
  });

  it("Mutation.deleteDevice(id)", async () => {
    const device = await new Device({ name: "lg1" }).save();
    const deletedDevice = await resolvers.Mutation.deleteDevice(
      null,
      { id: device.id.toString() },
      ctx,
      null
    );
    expect(deletedDevice.toObject()).toMatchObject(device.toObject());
    // Actualy gone from the db
    expect(await Device.findById(device.id)).toBeNull();
  });

  it("Device.activationQrUrl", () => {
    const result = resolvers.Device.activationQrUrl(d1);
    expect(result).toBe(routes["devices/qr"].path.replace(":id", d1.id));
  });

  it("Device.activationPasswordExpiresAt", () => {
    const result = resolvers.Device.activationPasswordExpiresAt(d1);
    expect(result).toBe(d1.activationPassword.payload.expiresAt);
  });

  beforeAll(async () => {
    await connect();
    d1 = await new Device({ name: "d1" }).save();
  });

  afterAll(async () => {
    await disconnect();
    // Remve any created models
  });
});
