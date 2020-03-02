import { connect, disconnect } from "../../../db";
import { models } from "../../../db/models";
import { VehicleFilter, VehicleFilterAction } from "../vehicleFilter.model";
import resolvers from "../vehicleFilter.resolvers";
import { Vehicle } from "../../../types/vehicle/vehicle.model";
import { Context } from "../../../db/gql";
import { Permission } from "../../permissions";

const ctx: Context = {
  models,
  token: { user: { id: "", permissions: [Permission.ALL] } }
};

describe("VehicleFilter resolvers", () => {
  beforeAll(connect);
  afterAll(disconnect);

  afterEach(async () => {
    await VehicleFilter.remove({});
    await Vehicle.remove({});
  });

  it("Query.vehicleFilters", async () => {
    const dbFilters = await VehicleFilter.create([
      {
        name: "filter1"
      },
      {
        name: "fitler2"
      }
    ]);
    const resolverFilters = (await resolvers.Query.vehicleFilters(
      null,
      {},
      ctx,
      null
    )).sort(); // Unordered
    expect(resolverFilters[0].toObject()).toMatchObject(
      dbFilters[0].toObject()
    );
    expect(resolverFilters[1].toObject()).toMatchObject(
      dbFilters[1].toObject()
    );
  });

  it("VehicleFilter.vehicles", async () => {
    const vehicle = await new Vehicle({ licensePlate: "123" }).save();
    const populatedVehicle = await new VehicleFilter({
      name: "filter1",
      vehicles: [vehicle]
    }).save();
    const unpopulatedFilter = await VehicleFilter.findById(populatedVehicle.id);

    const resolverVehicles = await resolvers.VehicleFilter.vehicles(
      unpopulatedFilter,
      null,
      ctx
    );

    expect(resolverVehicles[0].id.toString()).toBe(vehicle.id.toString());
  });
});
