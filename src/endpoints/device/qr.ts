import { Device } from "../../types/device/device.model";
import qrcode from "qrcode";
import mongoose from "mongoose";
import { AsyncHandler } from "../../app";
import lodash from "lodash";

const qr: AsyncHandler<{ id: any }> = async (req, res) => {
  const oid = req.params.id;
  if (oid == null || !mongoose.Types.ObjectId.isValid(oid)) {
    res.status(400).end();
    return;
  }
  const device = await Device.findById(oid);
  if (
    device == null ||
    lodash
      .get(device, "activationPassword.payload.expiresAt", new Date(0))
      .getTime() -
      new Date().getTime() <=
      0
  ) {
    res.status(400).end();
    return;
  }
  const imagePayload = {
    password: device.activationPassword.payload.password,
    expiresAt: device.activationPassword.payload.expiresAt.getTime()
  };
  // TODO: This is here for dev purposes
  console.log(imagePayload);
  qrcode.toFileStream(res, JSON.stringify(imagePayload));
  res.status(200);
};

export default qr;
