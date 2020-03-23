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

  device.lastContact = new Date();
  if (typeof lodash.get(req.body, "config", undefined) === "object") {
    device.config = { ...device.config.toObject(), ...req.body.config };
    device.shouldSendConfig = true;
  }

  if (device.shouldSendConfig) {
    const response = {
      data: { config: device.config }
    };
    res.send(response);
    device.shouldSendConfig = false;
  } else {
    res.send({});
  }
  await device.save();

  return next();
};

export default updateConfig;
