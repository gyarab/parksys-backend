import { recognizePlate, LprResponse, findRectangle } from "../lprApi";
import path from "path";
import base64Img from "base64-img";
import { AxiosResponse } from "axios";
import Clipper from "image-clipper";
import Canvas from "canvas";

const imagePath = path.join(process.cwd(), "test_assets/plate_1AN-9714.jpg");

const loadImageAndRequest = async () => {
  return await new Promise<AxiosResponse<LprResponse>>((resolve, reject) => {
    base64Img.base64(imagePath, (err, img) => {
      if (err) reject("Error while reading test image file");
      resolve(
        new Promise<AxiosResponse<LprResponse>>(async (resolve, reject) => {
          try {
            resolve(await recognizePlate(img));
          } catch (e) {
            reject(e);
          }
        })
      );
    });
  });
};

describe("lprApi", () => {
  it("api works", async () => {
    const response = await loadImageAndRequest();
    const {
      results: [first]
    } = response.data;
    expect(first.plate).toBe("1AN9714");
    expect(first.confidence).toBeGreaterThanOrEqual(80);
    // Cut plate
    const res = await new Promise(resolve => {
      Clipper(imagePath, { canvas: Canvas }, function() {
        const rect = findRectangle(first.coordinates);
        const offset = 50;
        const args = [
          rect.points[0].x - offset,
          rect.points[0].y - offset,
          rect.width + offset * 2,
          rect.height + offset * 2
        ];
        this.crop(...args);
        this.toFile(
          path.join(process.cwd(), `test_assets/rect_${first.plate}.jpg`),
          () => resolve(true)
        );
      });
    });
    expect(res).toBe(true);
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
