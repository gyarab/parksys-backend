import { Device } from "../../device/device.model";
import qrcode from "qrcode";

// TODO: QR Code from activation passwod
const qr = async (req, res) => {
  const deviceName = req.params.name;
  if (!deviceName) {
    res.status(400).end();
    return;
  }
  const device = await Device.find({ name: deviceName });
  if (device.length == 0) {
    res.status(400).end();
    return;
  }
  qrcode.toFileStream(res, device[0].activationPassword.payload);
  res.status(200);
};

export default qr;
