import { Device } from "../../types/device/device.model";
import qrcode from "qrcode";
import mongoose from "mongoose";

const qr = async (req, res) => {
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
  qrcode.toFileStream(res, JSON.stringify(device.activationPassword.payload));
  res.status(200);
};

export default qr;
