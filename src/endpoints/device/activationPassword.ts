import { Device } from "../../types/device/device.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { Permission } from "../../types/permissions";
import { createTokenPair } from "../../auth/tokenUtils";
import config from "../../config";
import { AsyncHandler } from "../../app";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";

const deviceActivationEndpoint: AsyncHandler<any> = async (req, res, next) => {
  const { activationPassword } = req.body;
  if (!activationPassword) {
    res.status(401).send({ error: "activation password must be supplied" });
    return next();
  }
  const now = new Date();
  const device = await Device.findOne({
    "activationPassword.method": AuthenticationMethod.ACTIVATION_PASSWORD,
    "activationPassword.payload.password": activationPassword,
    "activationPassword.payload.expiresAt": { $gt: now },
    activated: false
  });
  if (!device) {
    res
      .status(401)
      .send({ error: "device not found or wrong/expired credentials" });
    return next();
  }

  const {
    accessToken,
    refreshToken: { str: refreshToken, obj: refreshTokenObj }
  } = await createTokenPair(
    {
      expiresAt: now.getTime() + config.get("security:userAccessTokenDuration"),
      device: {
        id: device.id,
        permissions: [Permission.ALL]
      }
    },
    {
      method: AuthenticationMethod.ACTIVATION_PASSWORD
    },
    RefreshToken
  );

  // OK -> activate
  device.activated = true;
  device.activatedAt = now;
  device.refreshToken = refreshTokenObj;
  await device.save();

  res.send({
    data: { refreshToken, accessToken, device: device.toJSON() }
  });
  return next();
};

export default deviceActivationEndpoint;
