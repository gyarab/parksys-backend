import resolvers from "../parkingRuleAssignment.resolvers";
import { connect, disconnect } from "../../../db";
import { models } from "../../../db/models";
import {
  ParkingRuleAssignment,
  IParkingRuleAssignment,
  VehicleFilterMode
} from "../parkingRuleAssignment.model";
import { Context } from "../../../db/gql";

const ctx: Context = { models };

describe("ParkingRuleAssignment resolvers", () => {
  describe("ParkingRuleAssignment.updateParkingRuleAssignment(id, input)", () => {
    let pRA1: IParkingRuleAssignment = null;
    let pRA2: IParkingRuleAssignment = null;
    it("normal", async () => {
      const result1 = await resolvers.Mutation.updateParkingRuleAssignment(
        null,
        {
          id: pRA1._id.toString(),
          input: {
            priority: 3,
            start: new Date(1551000000000),
            end: new Date(1560000000000)
          }
        },
        ctx,
        null
      );
      expect(result1.id).toBeDefined();

      const result2 = await resolvers.Mutation.updateParkingRuleAssignment(
        null,
        {
          id: pRA1._id.toString(),
          input: {
            vehicleFilterMode: VehicleFilterMode.NONE
          }
        },
        ctx,
        null
      );
      expect(result2.id).toBeDefined();

      const result3 = await resolvers.Mutation.updateParkingRuleAssignment(
        null,
        {
          id: pRA1._id.toString(),
          input: {
            priority: 2,
            // Starts when pRA2 ends but does not collide
            start: new Date(1551000000000),
            end: new Date(1552000000000)
          }
        },
        ctx,
        null
      );
      expect(result3.id).toBeDefined();
    });

    it("time-priority collision", async () => {
      const result1 = await resolvers.Mutation.updateParkingRuleAssignment(
        null,
        {
          id: pRA1._id.toString(),
          input: {
            priority: 2
          }
        },
        ctx,
        null
      );
      expect(result1.collisions[0]._id.toString()).toBe(pRA2._id.toString());
      expect(result1.collisions).toHaveLength(1);
      const result2 = await resolvers.Mutation.updateParkingRuleAssignment(
        null,
        {
          id: pRA1._id.toString(),
          input: {
            priority: 2,
            start: new Date(1540000000000),
            end: new Date(1550000000000 + 1)
          }
        },
        ctx,
        null
      );
      expect(result2.collisions[0]._id.toString()).toBe(pRA2._id.toString());
      expect(result2.collisions).toHaveLength(1);
    });

    it("ParkingRuleAssignmentUpdateResult.__resolveType", async () => {
      const result1 = resolvers.ParkingRuleAssignmentUpdateResult.__resolveType(
        { collisions: [pRA2._id] }
      );
      expect(result1).toBe("ParkingRuleAssignmentResultUpdateError");
      const result2 = resolvers.ParkingRuleAssignmentUpdateResult.__resolveType(
        pRA1
      );
      expect(result2).toBe("ParkingRuleAssignment");
    });

    it("ParkingRuleAssignmentResultUpdateError.collsions", async () => {
      const result = await resolvers.ParkingRuleAssignmentResultUpdateError.collisions(
        { collisions: [pRA1, pRA2] },
        null,
        ctx,
        null
      );
      expect(result).toHaveLength(2);
      expect(result[0]._id.toString()).not.toBe(result[1]._id.toString());
    });

    beforeEach(async () => {
      [pRA1, pRA2] = await ParkingRuleAssignment.create([
        {
          priority: 1,
          start: new Date(1550000000000),
          end: new Date(1551000000000),
          vehicleFilterMode: VehicleFilterMode.ALL
        },
        {
          priority: 2,
          start: new Date(1550000000000),
          end: new Date(1551000000000),
          vehicleFilterMode: VehicleFilterMode.ALL
        }
      ]);
    });

    afterEach(
      async () => await Promise.all([ParkingRuleAssignment.remove({})])
    );
  });

  beforeAll(connect);
  afterAll(disconnect);
});
