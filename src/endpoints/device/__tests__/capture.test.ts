import request from "supertest";
import { Device, IDevice } from "../../../types/device/device.model";
import { app, begin } from "../../../app";
import { disconnect } from "../../../db";
import routes from "../../routes";
import { Permission } from "../../../types/permissions";
import { createTokenPair } from "../../../auth/auth";
import path from "path";
import { AuthenticationMethod } from "../../../types/authentication/authentication.model";
import { RefreshToken } from "../../../types/refreshToken/refreshToken.model";
import {
  filenameToDate,
  findAppliedRules,
  createFilterApplier
} from "../capture";
import {
  ParkingRule,
  ParkingRuleTimedFee,
  IParkingRule,
  ParkingRulePermitAccess,
  ParkingTimeUnit
} from "../../../types/parking/parkingRule.model";
import {
  ParkingRuleAssignment,
  IParkingRuleAssignment,
  VehicleSelectorMode
} from "../../../types/parking/parkingRuleAssignment.model";
import { Vehicle, IVehicle } from "../../../types/vehicle/vehicle.model";
import {
  VehicleFilter,
  IVehicleFilter,
  VehicleFilterAction
} from "../../../types/parking/vehicleFilter.model";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);
const req = request(app);
const CAPTURE_ENDPOINT = () => routes["devices/capture"].path;

describe("capture endpoint", () => {
  let validAccessToken = null;
  it("should return config once", async () => {
    let resp = await req
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

    resp = await req
      .post(CAPTURE_ENDPOINT())
      .attach("capture_" + new Date().getTime(), testImagePath)
      .set("Authorization", `Bearer ${validAccessToken}`);
    expect(resp.status).toBe(200);
    expect(resp.body).toStrictEqual({});
  });

  describe("findAppliedRules", () => {
    describe("select some with fiters", () => {
      let vehicles: Array<IVehicle> = null;
      let vehicleFilters: Array<IVehicleFilter> = null;
      let parkingRules: Array<IParkingRule> = null;
      let parkingRuleAssignments: Array<IParkingRuleAssignment> = null;

      beforeAll(async () => {
        await Promise.all([
          Vehicle.remove({}),
          VehicleFilter.remove({}),
          ParkingRuleAssignment.remove({}),
          ParkingRule.remove({})
        ]);
        // Vehicles & VehicleFilters
        vehicles = await Vehicle.create([
          { licensePlate: "123" },
          { licensePlate: "456" }
        ]);

        // ParkingRules
        parkingRules = [
          ...(await ParkingRuleTimedFee.create([
            {
              name: "regularFeeRule",
              unitTime: ParkingTimeUnit.HOUR,
              centsPerUnitTime: 100
            },
            {
              name: "highFeeRule",
              // Super high fee
              unitTime: ParkingTimeUnit.MINUTE,
              centsPerUnitTime: 1000
            }
          ])),
          ...(await ParkingRulePermitAccess.create([
            {
              name: "freePassRule",
              permit: true
            }
          ]))
        ];

        vehicleFilters = await VehicleFilter.create([
          {
            name: "filter1",
            vehicles: [vehicles[0]],
            action: VehicleFilterAction.EXCLUDE
          },
          {
            name: "filter2",
            vehicles: [vehicles[1]],
            action: VehicleFilterAction.INCLUDE
          },
          {
            name: "filter3",
            vehicles: [vehicles[0]],
            action: VehicleFilterAction.INCLUDE
          }
        ]);

        parkingRuleAssignments = await ParkingRuleAssignment.create([
          {
            rules: [parkingRules[0]],
            // Applies to all
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-01T00:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            priority: 1
          },
          {
            rules: [parkingRules[1]],
            // Only applies to 456
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [vehicleFilters[1], vehicleFilters[0]],
            start: new Date("2019-12-01T12:00:00.000Z"),
            end: new Date("2019-12-01T15:00:00.000Z"),
            priority: 2
          },
          {
            rules: [parkingRules[2]],
            // Applies to all
            vehicleSelectorMode: VehicleSelectorMode.NONE,
            vehicleFilters: [vehicleFilters[2], vehicleFilters[1]],
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T18:00:00.000Z"),
            priority: 3
          }
        ]);
      });

      it("works", async () => {
        const start = new Date("2019-12-01T09:00:00.000Z");
        const end = new Date("2019-12-01T21:00:00.000Z");
        const result1 = await findAppliedRules(vehicles[0], start, end);
        const expected1 = [
          {
            start: new Date("2019-12-01T09:00:00.000Z"),
            end: new Date("2019-12-01T14:00:00.000Z"),
            assignment: { priority: 1 }
          },
          {
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T18:00:00.000Z"),
            assignment: { priority: 3 }
          },
          {
            start: new Date("2019-12-01T18:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            assignment: { priority: 1 }
          }
        ];

        const result2 = await findAppliedRules(vehicles[1], start, end);
        const expected2 = [
          {
            start: new Date("2019-12-01T09:00:00.000Z"),
            end: new Date("2019-12-01T12:00:00.000Z"),
            assignment: { priority: 1 }
          },
          {
            start: new Date("2019-12-01T12:00:00.000Z"),
            end: new Date("2019-12-01T14:00:00.000Z"),
            assignment: { priority: 2 }
          },
          {
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T18:00:00.000Z"),
            assignment: { priority: 3 }
          },
          {
            start: new Date("2019-12-01T18:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            assignment: { priority: 1 }
          }
        ];

        function verifyResult(result, expected) {
          for (let i = 0; i < Math.min(result.length, expected.length); i++) {
            expect(expected[i]).toMatchObject(result[i]);
          }
          expect(result.length).toBe(expected.length);
        }
        verifyResult(expected1, result1);
        verifyResult(expected2, result2);
      });
    });

    describe("select all with filters", () => {
      let vehicles: Array<IVehicle> = null;
      let parkingRules: Array<IParkingRule> = null;
      let parkingRuleAssignments: Array<IParkingRuleAssignment> = null;

      // Quite an elaborate setup
      beforeAll(async () => {
        await Promise.all([
          Vehicle.remove({}),
          VehicleFilter.remove({}),
          ParkingRuleAssignment.remove({}),
          ParkingRule.remove({})
        ]);
        // Vehicles & VehicleFilters
        vehicles = await Vehicle.create([
          // Pays less at some times
          { licensePlate: "123A4567" },
          // Pays regularFeeRule
          { licensePlate: "007X0042" },
          // Pays regularFeeRule
          { licensePlate: "101Z0101" }
        ]);

        // ParkingRules
        parkingRules = [
          ...(await ParkingRuleTimedFee.create([
            {
              name: "regularFeeRule",
              unitTime: ParkingTimeUnit.HOUR,
              centsPerUnitTime: 100
            },
            {
              name: "highFeeRule",
              // Super high fee
              unitTime: ParkingTimeUnit.MINUTE,
              centsPerUnitTime: 1000
            }
          ])),
          ...(await ParkingRulePermitAccess.create([
            {
              name: "freePassRule",
              permit: true
            }
          ]))
        ];

        parkingRuleAssignments = await ParkingRuleAssignment.create([
          {
            rules: [parkingRules[0]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-10-01T00:00:00.000Z"),
            end: new Date("2019-12-02T16:00:00.000Z"),
            priority: 8
          },
          {
            rules: [parkingRules[1]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-01T15:30:00.000Z"),
            end: new Date("2019-12-01T17:00:00.000Z"),
            priority: 11
          },
          {
            rules: [parkingRules[2]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-01T07:00:00.000Z"),
            end: new Date("2019-12-01T17:00:00.000Z"),
            priority: 9
          },
          {
            rules: [parkingRules[0]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T16:00:00.000Z"),
            priority: 12
          },
          {
            rules: [parkingRules[0]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-01T20:00:00.000Z"),
            end: new Date("2019-12-02T16:00:00.000Z"),
            priority: 10
          },
          {
            rules: [parkingRules[0]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-02T02:00:00.000Z"),
            end: new Date("2019-12-02T16:00:00.000Z"),
            priority: 12
          },
          {
            rules: [parkingRules[2]],
            vehicleSelectorMode: VehicleSelectorMode.ALL,
            vehicleFilters: [],
            start: new Date("2019-12-02T16:30:00.000Z"),
            end: new Date("2019-12-02T18:00:00.000Z"),
            priority: 9
          }
        ]);
      });

      it("full day", async () => {
        const result = await findAppliedRules(
          vehicles[0],
          new Date("2019-12-01T00:00:00.000Z"),
          new Date(new Date("2019-12-02T00:00:00.000Z").getTime() - 1)
        );
        const expected = [
          {
            start: new Date("2019-12-01T00:00:00.000Z"),
            end: new Date("2019-12-01T07:00:00.000Z"),
            assignment: { priority: 8 }
          },
          {
            start: new Date("2019-12-01T07:00:00.000Z"),
            end: new Date("2019-12-01T14:00:00.000Z"),
            assignment: { priority: 9 }
          },
          {
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T16:00:00.000Z"),
            assignment: { priority: 12 }
          },
          {
            start: new Date("2019-12-01T16:00:00.000Z"),
            end: new Date("2019-12-01T17:00:00.000Z"),
            assignment: { priority: 11 }
          },
          {
            start: new Date("2019-12-01T17:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            assignment: { priority: 8 }
          },
          {
            start: new Date("2019-12-01T20:00:00.000Z"),
            end: new Date(new Date("2019-12-02T00:00:00.000Z").getTime() - 1),
            assignment: { priority: 10 }
          }
        ];
        for (let i = 0; i < Math.min(result.length, expected.length); i++) {
          expect(result[i]).toMatchObject(expected[i]);
        }
        expect(result.length).toBe(expected.length);
      });

      it("part of a day", async () => {
        const result = await findAppliedRules(
          vehicles[0],
          new Date("2019-12-01T06:00:00.000Z"),
          new Date("2019-12-01T20:01:00.000Z")
        );
        const expected = [
          {
            start: new Date("2019-12-01T06:00:00.000Z"),
            end: new Date("2019-12-01T07:00:00.000Z"),
            assignment: { priority: 8 }
          },
          {
            start: new Date("2019-12-01T07:00:00.000Z"),
            end: new Date("2019-12-01T14:00:00.000Z"),
            assignment: { priority: 9 }
          },
          {
            start: new Date("2019-12-01T14:00:00.000Z"),
            end: new Date("2019-12-01T16:00:00.000Z"),
            assignment: { priority: 12 }
          },
          {
            start: new Date("2019-12-01T16:00:00.000Z"),
            end: new Date("2019-12-01T17:00:00.000Z"),
            assignment: { priority: 11 }
          },
          {
            start: new Date("2019-12-01T17:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            assignment: { priority: 8 }
          },
          {
            start: new Date("2019-12-01T20:00:00.000Z"),
            end: new Date("2019-12-01T20:01:00.000Z"),
            assignment: { priority: 10 }
          }
        ];
        for (let i = 0; i < Math.min(result.length, expected.length); i++) {
          expect(result[i]).toMatchObject(expected[i]);
        }
        expect(result.length).toBe(expected.length);
      });

      it("within two days - overnight", async () => {
        const result = await findAppliedRules(
          vehicles[0],
          new Date("2019-12-01T16:30:00.000Z"),
          new Date("2019-12-02T17:00:00.000Z")
        );
        const expected = [
          {
            start: new Date("2019-12-01T16:30:00.000Z"),
            end: new Date("2019-12-01T17:00:00.000Z"),
            assignment: { priority: 11 }
          },
          {
            start: new Date("2019-12-01T17:00:00.000Z"),
            end: new Date("2019-12-01T20:00:00.000Z"),
            assignment: { priority: 8 }
          },
          {
            start: new Date("2019-12-01T20:00:00.000Z"),
            end: new Date("2019-12-02T02:00:00.000Z"),
            assignment: { priority: 10 }
          },
          {
            start: new Date("2019-12-02T02:00:00.000Z"),
            end: new Date("2019-12-02T16:00:00.000Z"),
            assignment: { priority: 12 }
          },
          {
            start: new Date("2019-12-02T16:30:00.000Z"),
            end: new Date("2019-12-02T17:00:00.000Z"),
            assignment: { priority: 9 }
          }
        ];
        for (let i = 0; i < Math.min(result.length, expected.length); i++) {
          expect(result[i]).toMatchObject(expected[i]);
        }
        expect(result.length).toBe(expected.length);
      });

      it("nothing should be returned", async () => {
        const result1 = await findAppliedRules(
          vehicles[0],
          // Delta = 0
          new Date("2019-12-01T16:30:00.000Z"),
          new Date("2019-12-01T16:30:00.000Z")
        );
        expect(result1).toHaveLength(0);
        const result2 = await findAppliedRules(
          vehicles[0],
          // No rules
          new Date("2030-12-01T16:30:00.000Z"),
          new Date("2030-12-02T17:00:00.000Z")
        );
        expect(result2).toHaveLength(0);
        const result3 = await findAppliedRules(
          vehicles[0],
          // No rules
          new Date("2019-12-02T16:15:00.000Z"),
          new Date("2019-12-02T16:20:00.000Z")
        );
        expect(result3).toHaveLength(0);
        const result4 = await findAppliedRules(
          vehicles[0],
          // End < Start
          new Date("2019-12-02T17:00:00.000Z"),
          new Date("2019-12-01T16:30:00.000Z")
        );
        expect(result4).toHaveLength(0);
      });
    });
  });

  describe("createFilterApplier", () => {
    let vehicle1: IVehicle = null;
    let vehicle2: IVehicle = null;
    let ruleAssignment1: IParkingRuleAssignment = null;
    let ruleAssignment2: IParkingRuleAssignment = null;
    let ruleAssignment3: IParkingRuleAssignment = null;
    let ruleAssignment4: IParkingRuleAssignment = null;
    beforeAll(async () => {
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
        ruleAssignment4
      ] = await ParkingRuleAssignment.create([
        {
          ...rACommons,
          // None
          vehicleSelectorMode: VehicleSelectorMode.NONE
        },
        {
          ...rACommons,
          // ALL
          vehicleSelectorMode: VehicleSelectorMode.ALL
        },
        {
          ...rACommons,
          // 123 only
          vehicleSelectorMode: VehicleSelectorMode.NONE,
          vehicleFilters: [include456, include123, exclude456]
        },
        {
          ...rACommons,
          // 456 only
          vehicleSelectorMode: VehicleSelectorMode.ALL,
          vehicleFilters: [exclude123]
        }
      ]);
    });
    afterAll(
      async () =>
        await Promise.all([
          Vehicle.remove({}),
          ParkingRuleAssignment.remove({}),
          VehicleFilter.remove({})
        ])
    );
    it("works", () => {
      const applier1 = createFilterApplier(vehicle1);
      expect(applier1(ruleAssignment1)).toBe(false);
      expect(applier1(ruleAssignment2)).toBe(true);
      expect(applier1(ruleAssignment3)).toBe(true);
      expect(applier1(ruleAssignment4)).toBe(false);

      const applier2 = createFilterApplier(vehicle2);
      expect(applier2(ruleAssignment1)).toBe(false);
      expect(applier2(ruleAssignment2)).toBe(true);
      expect(applier2(ruleAssignment3)).toBe(false);
      expect(applier2(ruleAssignment4)).toBe(true);
    });
  });

  it("filenameToDate", () => {
    const t = new Date().getTime();
    expect(filenameToDate(`capture_${t}.jpg`).getTime()).toBe(t);
  });

  beforeAll(async () => {
    await begin();
    const devices: IDevice[] = await Device.create([
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
      },
      RefreshToken
    );
    validAccessToken = tokens.accessToken;
    devices[0].refreshToken = tokens.refreshToken.obj;
    await devices[0].save();
  });

  afterAll(async () => {
    await disconnect();
  });
});
