import { TimeSchema, Time } from "../time.model";
import mongoose from "mongoose";

describe("schema Time", () => {
  const instance1: Time = {
    hours: 10,
    minutes: 10
  };
  const instance2: Time = {
    hours: 24,
    minutes: 0
  };
  const Usage1 = mongoose.model(
    "_usage1",
    new mongoose.Schema({
      time: TimeSchema(true, true, "time")
    })
  );
  const Usage2 = mongoose.model(
    "_usage2",
    new mongoose.Schema({
      time: TimeSchema(true, true)
    })
  );

  it("has correct default behaviour", async () => {
    const t1 = TimeSchema();
    expect(t1.hours.required).toBe(false);
    expect(t1.minutes.required).toBe(false);
    expect(t1.hours.validate.validator(instance1.hours)).toBe(true);
    expect(t1.minutes.validate.validator(instance1.minutes)).toBe(true);
    // 24:00
    expect(t1.hours.validate.validator(instance2.hours)).toBe(false);
    // Invalid
    expect(t1.hours.validate.validator(-1)).toBe(false);
    expect(t1.hours.validate.validator(0.5)).toBe(false);
    expect(t1.hours.validate.validator(25)).toBe(false);
    expect(t1.minutes.validate.validator(-1)).toBe(false);
    expect(t1.minutes.validate.validator(60)).toBe(false);
  });

  it("24:00", async () => {
    try {
      await new Usage1({ time: instance2 }).validate();
    } catch (e) {
      fail(e);
    }
    try {
      await new Usage2({ time: instance2 }).validate();
      fail("expected an error");
    } catch (e) {
      expect(e.errors["time.hours"]).toBeDefined();
    }
  });

  it("requires subfields", async () => {
    try {
      await new Usage1({}).validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors["time.hours"]).toBeDefined();
      expect(err.errors["time.minutes"]).toBeDefined();
    }
  });
});
