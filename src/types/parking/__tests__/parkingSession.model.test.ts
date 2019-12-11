import { ParkingSession } from "../parkingSession.model";

describe("model ParkingSession", () => {
  it("has correct defaults and required fields", async () => {
    const session1 = new ParkingSession({});
    expect(session1.checkIn).toBeDefined();
    expect(session1.checkIn.time).toBeInstanceOf(Date);
    expect(session1.active).toBe(true);

    try {
      await session1.validate();
      fail("expected an error");
    } catch (err) {
      expect(err).not.toBeNull();
      expect(err.errors.vehicle).toBeDefined();
    }
  });
});
