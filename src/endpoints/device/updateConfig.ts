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
    device.shouldSendConfig = true;
  }

  if (device.shouldSendConfig) {
    const response = {
      data: { config: device.config }
    };
    console.log("config", response);
    res.send(response);
    device.shouldSendConfig = false;
    await device.save();
  } else {
    console.log("config {}");
    res.send({});
  }

  return next();
};

export default updateConfig;
