import {
  findRectangle,
  loadImageAndRequest,
  cutImageUsingLprResponse
} from "../lprApi";
import path from "path";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);

describe("lprApi", () => {
  it("api works", async () => {
    const response = await loadImageAndRequest(testImagePath);
    const {
      results: [first]
    } = response.data;
    expect(first.plate).toBe("1AN9714");
    expect(first.confidence).toBeGreaterThanOrEqual(80);
    // Cut plate
    expect(
      await cutImageUsingLprResponse(
        testImagePath,
        path.join("/tmp", `rect_${first.plate}.jpg`),
        first
      )
    ).toBe(true);
  });

  it("find reactangle", () => {
    const rectangle = findRectangle([
      { x: -1, y: 0 },
      { x: 0, y: 5 },
      { x: 4, y: 6 },
      { x: -2, y: -1 }
    ]);
    expect(rectangle.points[0]).toStrictEqual({ x: -2, y: -1 });
    expect(rectangle.points).toContainEqual({ x: -2, y: 6 });
    expect(rectangle.points).toContainEqual({ x: 4, y: 6 });
    expect(rectangle.points).toContainEqual({ x: 4, y: -1 });
  });
});
