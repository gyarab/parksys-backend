import { Device } from "../../types/device/device.model";
import qrcode from "qrcode";
import mongoose from "mongoose";
import { AsyncHandler } from "../../app";

const qr: AsyncHandler<{ id: any }> = async (req, res) => {
  const oid = req.params.id;
  if (oid == null || !mongoose.Types.ObjectId.isValid(oid)) {
    res.status(400).end();
    return;
  }
  const device = await Device.findById(oid);
  if (device == null) {
    res.status(400).end();
    return;
  }
  const imagePayload = {
    password: device.activationPassword.payload.password,
    expiresAt: device.activationPassword.payload.expiresAt.getTime()
  };
  qrcode.toFileStream(res, JSON.stringify(imagePayload));
  res.status(200);
};

export default qr;
