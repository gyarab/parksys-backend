import Recognizer from "..";
import path from "path";

const testImagePath = path.join(
  process.cwd(),
  "test_assets/plate_1AN-9714.jpg"
);

describe("LicensePlateRecognition", () => {
  it("chosen api is instance of LicensePlateRecognition", async () => {
    const result = await Recognizer.recognizeLicensePlate(testImagePath);
    expect(result.best.plate).toBe("1AN9714");
    expect(result.best.confidence).toBeGreaterThanOrEqual(80);
  });
});
