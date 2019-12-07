import { begin } from "../../../app";
import resolvers from "../device.resolvers";
import { Device } from "../device.model";
import { Permission } from "../../../types/permissions";
import { models } from "../../../db/models";
import { Context } from "../../../db/gql";

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

  it("device(filter)", async () => {
    const dbDevice = (await Device.create([{ name: "d1" }, { name: "d2" }]))[0];
    const devices = await resolvers.Query.devices(
      null,
      { filter: { name: "d1" } },
      ctx,
      null
    );
    expect(devices).toHaveLength(1);
    expect(devices[0].name).toBe("d1");
    expect(devices[0].id).toBe(dbDevice.id);

    expect(
      await resolvers.Query.devices(
        null,
        { filter: { activated: true } },
        ctx,
        null
      )
    ).toStrictEqual([]);
  });

  it("addDevice(input)", async () => {
    const res = (await resolvers.Mutation.addDevice(
      null,
      {
        input: {
          name: "d1"
        }
      },
      ctx,
      null
    )).toJSON();
    expect(res.id).toBeDefined();
    expect(res.name).toBe("d1");

    const dbDevice = await Device.findById(res.id);
    expect(dbDevice.name).toBe("d1");
    expect(dbDevice).toMatchObject(res);
  });

  it("regenerateActivationPassword", async () => {
    const dbDevices = await Device.create([{ name: "d1" }]);
    const resp = (await resolvers.Mutation.regenerateActivationPassword(
      null,
      {
        id: dbDevices[0].id
      },
      ctx,
      null
    )).toJSON();
    // Activation password should not be returned
    expect(resp.activated).toBe(false);
    // Verify DB
    const d1 = await Device.findById(dbDevices[0].id);
    expect(d1.activationPassword).not.toMatchObject(
      dbDevices[0].activationPassword
    );
    expect(d1.activated).toBe(false);
  });

  afterEach(async () => {
    await Device.remove({});
  });

  beforeAll(async () => {
    await begin();
    // Create any required models
  });

  afterAll(async () => {
    // await disconnect();
    // Remve any created models
  });
});
