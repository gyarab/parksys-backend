import ExpressOpenAlpr, { findRectangle } from "../expressOpenAlpr";
import path from "path";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);

describe("ExpressOpenAlpr", () => {
  it("api works", async () => {
    const recognition = new ExpressOpenAlpr();
    const result = await recognition.recognizeLicensePlate(testImagePath);
    expect(result.best.plate).toBe("1AN9714");
    expect(result.best.confidence).toBeGreaterThanOrEqual(80);
  });

  it("find reactangle", () => {
    const rectangle = findRectangle([
      { x: -1, y: 0 },
      { x: 0, y: 5 },
      { x: 4, y: 6 },
      { x: -2, y: -1 }
    ]);
    // First member of the array should be the point closest to the origin
    expect(rectangle.points[0]).toStrictEqual({ x: -2, y: -1 });
    expect(rectangle.points).toContainEqual({ x: -2, y: 6 });
    expect(rectangle.points).toContainEqual({ x: 4, y: 6 });
    expect(rectangle.points).toContainEqual({ x: 4, y: -1 });
  });
});
