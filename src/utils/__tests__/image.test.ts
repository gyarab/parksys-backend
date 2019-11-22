import { findRectangle } from "../image";

describe("image", () => {
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
