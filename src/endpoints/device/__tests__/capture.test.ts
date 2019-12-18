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
import { filenameToDate, findAppliedRules } from "../capture";
import {
  ParkingRule,
  ParkingRuleTimedFee,
  IParkingRule,
  ParkingRulePermitAccess,
  ParkingTimeUnit
} from "../../../types/parking/parkingRule.model";
import {
  ParkingRuleAssignment,
  IParkingRuleAssignment
} from "../../../types/parking/parkingRuleAssignment.model";
import {
  ParkingRuleDayAssignment,
  IParkingRuleDayAssignment
} from "../../../types/parking/parkingRuleDayAssignment.model";
import {
  ParkingRuleAssignmentGroup,
  IParkingRuleAssignmentGroup
} from "../../../types/parking/parkingRuleAssignmentGroup.model";
import { Vehicle, IVehicle } from "../../../types/vehicle/vehicle.model";
import {
  VehicleFilter,
  VehicleSelectorEnum,
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
  });

  describe("findAppliedRules", () => {
    let vehicles: Array<IVehicle> = null;
    let vehicleSelectorAll = null;
    let vehicleSelectorNone = null;
    let vehicleFilters: Array<IVehicleFilter> = null;
    let parkingRules: Array<IParkingRule> = null;
    let parkingRuleAssignments: Array<IParkingRuleAssignment> = null;
    let parkingAssignmentGroup: IParkingRuleAssignmentGroup = null;
    let parkingDay1: IParkingRuleDayAssignment = null;
    let parkingDay2: IParkingRuleDayAssignment = null;

    // Quite an elaborate setup
    beforeAll(async () => {
      await Promise.all([
        Vehicle.remove({}),
        VehicleFilter.remove({}),
        ParkingRuleDayAssignment.remove({}),
        ParkingRuleAssignmentGroup.remove({}),
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

      vehicleSelectorAll = { singleton: VehicleSelectorEnum.ALL };
      vehicleSelectorNone = { singleton: VehicleSelectorEnum.NONE };
      vehicleFilters = await VehicleFilter.create([
        {
          name: "filter1",
          vehicles: [vehicles[0]],
          action: VehicleFilterAction.EXCLUDE
        },
        {
          name: "filter2",
          vehicles: [vehicles[0]],
          action: VehicleFilterAction.INCLUDE
        }
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

      parkingRuleAssignments = [
        new ParkingRuleAssignment({
          rule: parkingRules[0],
          vehicleSelectors: [vehicleSelectorAll],
          start: { hours: 0, minutes: 0 },
          end: { hours: 24, minutes: 0 },
          priority: 8
        }),
        new ParkingRuleAssignment({
          rule: parkingRules[1],
          vehicleSelectors: [vehicleSelectorAll],
          start: { hours: 15, minutes: 30 },
          end: { hours: 17, minutes: 0 },
          priority: 11
        }),
        new ParkingRuleAssignment({
          rule: parkingRules[2],
          vehicleSelectors: [vehicleSelectorAll],
          start: { hours: 7, minutes: 0 },
          end: { hours: 17, minutes: 0 },
          priority: 9
        }),
        new ParkingRuleAssignment({
          rule: parkingRules[0],
          vehicleSelectors: [vehicleSelectorAll],
          start: { hours: 14, minutes: 0 },
          end: { hours: 16, minutes: 0 },
          priority: 12
        }),
        new ParkingRuleAssignment({
          rule: parkingRules[0],
          vehicleSelectors: [vehicleSelectorAll],
          start: { hours: 17, minutes: 30 },
          end: { hours: 20, minutes: 0 },
          priority: 10
        })
      ];

      parkingAssignmentGroup = await new ParkingRuleAssignmentGroup({
        ruleAssignments: parkingRuleAssignments,
        name: "regularGroup"
      }).save();

      parkingDay1 = await new ParkingRuleDayAssignment({
        day: new Date("2019-12-01"),
        groups: [parkingAssignmentGroup]
      }).save();
      parkingDay2 = await new ParkingRuleDayAssignment({
        day: new Date("2019-12-02"),
        groups: [parkingAssignmentGroup]
      }).save();
    });

    it("within one day - full day", async () => {
      const result = await findAppliedRules(
        vehicles[0],
        new Date("2019-12-01 00:00:00"),
        new Date("2019-12-01 23:59:59")
      );
      const expected = [
        {
          start: { hours: 0, minutes: 0 },
          end: { hours: 7, minutes: 0 },
          priority: 8
        },
        {
          start: { hours: 7, minutes: 0 },
          end: { hours: 14, minutes: 0 },
          priority: 9
        },
        {
          start: { hours: 14, minutes: 0 },
          end: { hours: 16, minutes: 0 },
          priority: 12
        },
        {
          start: { hours: 16, minutes: 0 },
          end: { hours: 17, minutes: 0 },
          priority: 11
        },
        {
          start: { hours: 17, minutes: 0 },
          end: { hours: 17, minutes: 30 },
          priority: 8
        },
        {
          start: { hours: 17, minutes: 30 },
          end: { hours: 20, minutes: 0 },
          priority: 10
        },
        {
          start: { hours: 20, minutes: 30 },
          end: { hours: 24, minutes: 0 },
          priority: 8
        }
      ];
      // console.log(util.inspect(result, false, 4, true));
      // TODO: Solve the Date issues
      // console.log(Object.keys(result));
      // expect(Object.keys(result)).toHaveLength(1);
      const d1 = result["2019-11-30"];
      expect(d1).toHaveLength(1);
      for (let i = 0; i < d1[0]; i++) {
        expect(d1[0][i]).toMatchObject(expected[i]);
      }
    });

    it("within one day - part of the day", async () => {
      const result = await findAppliedRules(
        vehicles[0],
        new Date("2019-12-01 07:30:00"),
        new Date("2019-12-01 19:00:00")
      );
      const expected = [
        {
          start: { hours: 7, minutes: 30 },
          end: { hours: 14, minutes: 0 },
          priority: 9
        },
        {
          start: { hours: 14, minutes: 0 },
          end: { hours: 16, minutes: 0 },
          priority: 12
        },
        {
          start: { hours: 16, minutes: 0 },
          end: { hours: 17, minutes: 0 },
          priority: 11
        },
        {
          start: { hours: 17, minutes: 0 },
          end: { hours: 17, minutes: 30 },
          priority: 8
        },
        {
          start: { hours: 17, minutes: 30 },
          end: { hours: 19, minutes: 0 },
          priority: 10
        }
      ];
      // console.log(util.inspect(result, false, 4, true));
      // TODO: Solve the Date issues
      // console.log(Object.keys(result));
      // expect(Object.keys(result)).toHaveLength(1);
      const d1 = result["2019-11-30"];
      expect(d1).toHaveLength(1);
      for (let i = 0; i < d1[0]; i++) {
        expect(d1[0][i]).toMatchObject(expected[i]);
      }
    });

    it("within two days - overnight", async () => {
      const result = await findAppliedRules(
        vehicles[0],
        new Date("2019-12-01 15:03:00"),
        new Date("2019-12-02 14:42:00")
      );
      const expected1 = [
        {
          start: { hours: 15, minutes: 3 },
          end: { hours: 16, minutes: 0 },
          priority: 12
        },
        {
          start: { hours: 16, minutes: 0 },
          end: { hours: 17, minutes: 0 },
          priority: 11
        },
        {
          start: { hours: 17, minutes: 0 },
          end: { hours: 17, minutes: 30 },
          priority: 8
        },
        {
          start: { hours: 17, minutes: 30 },
          end: { hours: 19, minutes: 0 },
          priority: 10
        }
      ];
      const expected2 = [
        {
          start: { hours: 0, minutes: 0 },
          end: { hours: 14, minutes: 0 },
          priority: 9
        },
        {
          start: { hours: 14, minutes: 0 },
          end: { hours: 14, minutes: 42 },
          priority: 12
        }
      ];
      // console.log(util.inspect(result, false, 4, true));
      // TODO: Solve the Date issues
      // console.log(Object.keys(result));
      // expect(Object.keys(result)).toHaveLength(1);
      const d1 = result["2019-11-30"];
      const d2 = result["2019-12-01"];
      expect(d1).toHaveLength(1);
      for (let i = 0; i < d1[0]; i++) {
        expect(d1[0][i]).toMatchObject(expected1[i]);
      }
      for (let i = 0; i < d2[0]; i++) {
        expect(d2[0][i]).toMatchObject(expected2[i]);
      }
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
