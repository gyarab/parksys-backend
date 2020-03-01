import { Device } from "../../types/device/device.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { Permission } from "../../types/permissions";
import { createTokenPair, deviceAccessTokenData } from "../../auth/tokenUtils";
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
    accessToken: { str: accessToken },
    refreshToken: { str: refreshToken, db: refreshTokenDb }
  } = await createTokenPair(
    deviceAccessTokenData(
      {
        id: device.id,
        permissions: [Permission.ALL]
      }
      //now
    ),
    {
      method: AuthenticationMethod.ACTIVATION_PASSWORD
    },
    RefreshToken
  );

  // OK -> activate
  device.activated = true;
  device.activatedAt = now;
  device.refreshToken = refreshTokenDb;
  await device.save();

  res.send({
    data: { refreshToken, accessToken, device: device.toJSON() }
  });
  return next();
};

export default deviceActivationEndpoint;
