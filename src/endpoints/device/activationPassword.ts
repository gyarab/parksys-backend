import { Device } from "../../types/device/device.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { createToken } from "../../auth/jwt";
import config from "../../config";
import { Permission } from "../../types/permissions";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";

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
  }).select("-activationPassword -refreshToken");
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

  delete device.refreshToken;
  const respDevice = device.publicFields();
  res
    .status(200)
    .send({ data: { refreshToken, accessToken, device: respDevice } });
  return next();
};

export default activationPassword;
