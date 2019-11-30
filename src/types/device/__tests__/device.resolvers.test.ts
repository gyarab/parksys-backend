import { begin } from "../../../app";
import resolvers from "../device.resolvers";
import { Device } from "../device.model";
import { Permission } from "../../../types/permissions";
import routes from "../../../endpoints/routes";
import { Context } from "../../../db/gql";

describe("device resolvers", () => {
  const ctx: Context = {
    token: {
      user: {
        id: "",
        permissions: [Permission.ALL]
      }
    }
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
    expect(devices[0].activationQrUrl).toBe(
      routes["devices/qr"].path.replace(":id", devices[0].id)
    );

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
    const res = await resolvers.Mutation.addDevice(
      null,
      {
        input: {
          name: "d1"
        }
      },
      ctx,
      null
    );
    expect(res.id).toBeDefined();
    expect(res.name).toBe("d1");
    expect(res.activationPassword).toBeUndefined();
    expect(res.activationQrUrl).toBe(
      routes["devices/qr"].path.replace(":id", res.id)
    );

    const dbDevice = await Device.findById(res.id);
    expect(dbDevice.name).toBe("d1");
    expect(dbDevice).toMatchObject(res);
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
