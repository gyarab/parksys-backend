import { Device } from "../../device/device.model";
import { AuthenticationMethod } from "../../authentication/authentication.model";
import { createToken } from "../../auth/jwt";
import config from "../../config";
import { Permission } from "../../permissions";
import { RefreshToken } from "../../refreshToken/refreshToken.model";

const activationPassword = async (req, res, next) => {
  const { activationPassword } = req.body;
  if (!activationPassword) {
    res.status(401).send({ error: "activation password must be supplied" });
    return next();
  }
  const device = await Device.findOne({
    "activationPassword.method": AuthenticationMethod.ACTIVATION_PASSWORD,
    "activationPassword.payload.password": activationPassword,
    "activationPassword.payload.expiresAt": { $gt: new Date() },
    activated: false
  });
  if (!device) {
    res
      .status(401)
      .send({ error: "device not found or wrong/expired credentials" });
    return next();
  }
  // OK -> activate
  device.activated = true;

  // TODO: DRY
  const refresh = await new RefreshToken({}).save();
  device.refreshToken = refresh;
  await device.save();

  const rTokenData = {
    oid: refresh._id.toString()
  };
  const refreshToken = createToken(config.get("cryptSecret"), rTokenData);

  const aTokenData = {
    roid: rTokenData.oid,
    expiresAt: new Date().getTime() + 1000 * 60 * 30, // +30 minutes
    device: {
      id: device.id,
      permissions: [Permission.ALL]
    }
  };
  const accessToken = createToken(config.get("cryptSecret"), aTokenData);

  res.status(200).send({ data: { refreshToken, accessToken } });
  return next();
};

export default activationPassword;
