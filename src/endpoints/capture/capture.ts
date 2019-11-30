import { AsyncHandler } from "../../app";
import tmp from "tmp";
import path from "path";
import lpr from "../../apis/lpr";
import sharp from "sharp";

const capture: AsyncHandler = async (req, res, next) => {
  // File was accepted
  res.status(200).end();
  // Process
  if (req.files == null) return next();
  const files = req.files;
  Object.keys(files).forEach(key => {
    const file: any = files[key];
    tmp.file((err, fname2, fd, removeTmpFile) => {
      if (err) {
        console.error(err);
        return next(false);
      }
      const fname = path.join("/home/tmscer", `${key}.jpg`);

      sharp(file.data)
        .resize(1000, 1000)
        .toFile(fname)
        .then(info => {
          console.log(info);
          lpr
            .recognizeLicensePlate(fname)
            .then(result => {
              // Handle result
              console.log(result);
              removeTmpFile();
              return next();
            })
            .catch(err => {
              console.error(err.status);
              return next(false);
            });
        })
        .catch(err => {
          console.error(err);
          return next(false);
        });
    });
  });
};

export default capture;
