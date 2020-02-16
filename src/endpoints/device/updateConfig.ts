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
    device.config = { ...device.config.toObject(), ...req.body.config };
    res.send({
      data: { config: device.config.toObject() }
    });
    device.shouldSendConfig = false;
    await device.save();
  } else {
    res.send({});
  }
  return next();
};

export default updateConfig;
