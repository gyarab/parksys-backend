import { AsyncHandler } from "../../app";
import { Device } from "../../types/device/device.model";
import lodash from "lodash";

// Called by the device to update the server's device config.
const updateConfig: AsyncHandler<{ any }> = async (req, res, next) => {
  // Send back device config if updated
  const device = await Device.findById(req.token.device.id);
  if (!device) {
    res.status(400).end();
    return next();
  }

  if (typeof lodash.get(req.body, "config", undefined) === "object") {
    device.config = req.body.config;
    await device.save();
    res.status(200).end();
  } else {
    res.status(400).end();
  }
  return next();
};

export default updateConfig;
