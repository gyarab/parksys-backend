import {
  IParkingRuleAssignment,
  ParkingRuleAssignment,
  VehicleFilterMode
} from "../../../../types/parking/parkingRuleAssignment.model";
import { IVehicle, Vehicle } from "../../../../types/vehicle/vehicle.model";
import {
  VehicleFilter,
  VehicleFilterAction
} from "../../../../types/parking/vehicleFilter.model";
import { createFilterApplier } from "../filterApplier";
import { disconnect } from "../../../../db";
import { begin } from "../../../../app";

describe("createFilterApplier", () => {
  let vehicle1: IVehicle = null;
  let vehicle2: IVehicle = null;
  let ruleAssignment1: IParkingRuleAssignment = null;
  let ruleAssignment2: IParkingRuleAssignment = null;
  let ruleAssignment3: IParkingRuleAssignment = null;
  let ruleAssignment4: IParkingRuleAssignment = null;
  let ruleAssignment5: IParkingRuleAssignment = null;

  beforeAll(async () => {
    await begin();
    [vehicle1, vehicle2] = await Vehicle.create([
      { licensePlate: "123" },
      { licensePlate: "456" }
    ]);
    const [
      include123,
      exclude123,
      include456,
      exclude456
    ] = await VehicleFilter.create([
      {
        name: "include 123",
        action: VehicleFilterAction.INCLUDE,
        vehicles: [vehicle1._id]
      },
      {
        name: "exclude 123",
        action: VehicleFilterAction.EXCLUDE,
        vehicles: [vehicle1._id]
      },
      {
        name: "include 456",
        action: VehicleFilterAction.INCLUDE,
        vehicles: [vehicle2._id]
      },
      {
        name: "exclude 456",
        action: VehicleFilterAction.EXCLUDE,
        vehicles: [vehicle2._id]
      }
    ]);
    const rACommons = {
      start: new Date("2019-12-01T00:00:00.000Z"),
      end: new Date("2019-12-14T00:00:00.000Z"),
      priority: 0
    };
    [
      ruleAssignment1,
      ruleAssignment2,
      ruleAssignment3,
      ruleAssignment4,
      ruleAssignment5
    ] = await ParkingRuleAssignment.create([
      {
        ...rACommons,
        // None
        vehicleFilterMode: VehicleFilterMode.NONE
      },
      {
        ...rACommons,
        // ALL
        vehicleFilterMode: VehicleFilterMode.ALL,
        active: true
      },
      {
        ...rACommons,
        // 123 only
        vehicleFilterMode: VehicleFilterMode.NONE,
        vehicleFilters: [include456, include123, exclude456],
        active: true
      },
      {
        ...rACommons,
        // 456 only
        vehicleFilterMode: VehicleFilterMode.ALL,
        vehicleFilters: [exclude123],
        active: true
      },
      {
        ...rACommons,
        vehicleFilterMode: VehicleFilterMode.ALL,
        active: false
      }
    ]);
  });

  afterAll(async () => disconnect());

  it("works", () => {
    const applier1 = createFilterApplier(vehicle1);
    expect(applier1(ruleAssignment1)).toBe(false);
    expect(applier1(ruleAssignment2)).toBe(true);
    expect(applier1(ruleAssignment3)).toBe(true);
    expect(applier1(ruleAssignment4)).toBe(false);
    expect(applier1(ruleAssignment5)).toBe(false);

    const applier2 = createFilterApplier(vehicle2);
    expect(applier2(ruleAssignment1)).toBe(false);
    expect(applier2(ruleAssignment2)).toBe(true);
    expect(applier2(ruleAssignment3)).toBe(false);
    expect(applier2(ruleAssignment4)).toBe(true);
    expect(applier2(ruleAssignment5)).toBe(false);
  });
});
