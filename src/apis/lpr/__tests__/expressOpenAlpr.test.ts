import ExpressOpenAlpr from "../expressOpenAlpr";
import path from "path";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);

describe("ExpressOpenAlpr", () => {
  it("api works", async () => {
    const recognition = new ExpressOpenAlpr({
      protocol: "http",
      host: "localhost",
      port: 4500,
      country_code: "eu"
    });
    const result = await recognition.recognizeLicensePlate(testImagePath);
    expect(result.best.plate).toBe("1AN9714");
    expect(result.best.confidence).toBeGreaterThanOrEqual(80);
  });
});
