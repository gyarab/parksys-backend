import { CaptureImage } from "../types/captureImage/captureImage.model";
import mongoose from "mongoose";
import { AsyncHandler } from "../app";

const captureImage: AsyncHandler<{ id: any }> = async (req, res) => {
  const oid = req.params.id;
  if (oid == null || !mongoose.Types.ObjectId.isValid(oid)) {
    res.status(400).end();
    return;
  }
  const captureImage = await CaptureImage.findById(oid);
  // var base64Data = captureImage.data.replace(
  //   /^data:?image\/(png|jpeg|jpg);?base64,/,
  //   ""
  // );
  var img = Buffer.from(captureImage.data, "base64");

  res.writeHead(200, {
    "Content-Type": "image/png",
    Content: img.length
  });
  res.end(img);
  res.status(200);
};

export default captureImage;
