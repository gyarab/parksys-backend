import MemoryCache from "../memoryCache";

describe("memory cache", () => {
  const cache = new MemoryCache();

  it("set", () => {
    cache.set("one", 1);
    cache.set("two", 2);
  });

  it("get", () => {
    expect(cache.get("one")).toBe(1);
    expect(cache.get("two")).toBe(2);
  });

  it("delete", () => {
    expect(cache.delete("one")).toBe(1);
    expect(cache.get("one")).toBeUndefined();
    expect(cache.delete("two")).toBe(2);
  });

  it("deleteAll", () => {
    cache.deleteAll();
    expect(cache.get("two")).toBeUndefined();
  });

  it("has", () => {
    expect(cache.has("one")).toBe(false);
    expect(cache.has("two")).toBe(false);
    cache.set("three", 3);
    expect(cache.has("three")).toBe(true);
  });
});
