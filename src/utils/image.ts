import Clipper from "image-clipper";
import Canvas from "canvas";

export interface Rectangle {
  start: Coordinate;
  width: number;
  height: number;
}
export interface Coordinate {
  x: number;
  y: number;
}

// TODO: Move to an image cropper
// TODO: Return the cropped image
export const cropImageRectangle = (
  imagePath: string,
  outputPath: string,
  rectangle: Rectangle,
  offset: number = 50
): Promise<boolean> => {
  return new Promise(resolve => {
    Clipper(imagePath, { canvas: Canvas }, function() {
      const args = [
        rectangle.start.x - offset,
        rectangle.start.y - offset,
        rectangle.width + offset * 2,
        rectangle.height + offset * 2
      ];
      this.crop(...args);
      this.toFile(outputPath, () => resolve(true));
    });
  });
};

export const findRectangle = (a: Coordinate[]) => {
  let xMax = a[0].x;
  let xMin = a[0].x;
  let yMax = a[1].y;
  let yMin = a[1].y;
  for (let i = 1; i < a.length; i++) {
    xMax = Math.max(xMax, a[i].x);
    yMax = Math.max(yMax, a[i].y);
    xMin = Math.min(xMin, a[i].x);
    yMin = Math.min(yMin, a[i].y);
  }
  const points = [
    {
      x: xMin,
      y: yMin
    },
    {
      x: xMin,
      y: yMax
    },
    {
      x: xMax,
      y: yMax
    },
    {
      x: xMax,
      y: yMin
    }
  ];
  return {
    points,
    width: xMax - xMin,
    height: yMax - yMin
  };
};
