import crypto from "crypto";
import config from "../../config";
import { User, IUser } from "../../types/user/user.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { createTokenPair, IAccessTokenData } from "../../auth/auth";
import { AsyncHandler } from "../../app";

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        const str = hash.toString("hex");
        resolve(str);
      }
    });
  });
}

const password: AsyncHandler = async (req, res, next) => {
  const { user: userName, password } = req.body;
  if (
    !userName ||
    !password ||
    !(typeof userName == "string") ||
    !(typeof password == "string")
  ) {
    res.status(401).end();
    return next();
  }
  let user: IUser = await User.findOne({
    $or: [{ name: userName }, { email: userName }],
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } }
  });

  if (!user) {
    // User with password auth not found
    res.status(401).end();
    return next();
  }

  // Loop over every PASSWORD authentication
  for (const auth of user.authentications.filter(
    auth => auth.method == AuthenticationMethod.PASSWORD
  )) {
    if (
      !auth.payload.hasOwnProperty("h") ||
      !auth.payload.hasOwnProperty("s")
    ) {
      const msg = `PASSWORD authentication for user ${user.name} should have h and s props`;
      console.error(msg);
      res.status(500).end();
      return next(new Error(msg));
    }
    const { s: salt, h: hash } = auth.payload;

    const hashResult = await hashPassword(password, salt);
    if (hash === hashResult) {
      // Authenticated
      const aTokenData: IAccessTokenData = {
        expiresAt:
          new Date().getTime() + config.get("security:userAccessTokenDuration"),
        user: {
          id: user.id,
          permissions: user.permissions
        }
      };
      const {
        accessToken,
        refreshToken: { str: refreshToken, obj: refreshTokenObj }
      } = await createTokenPair(aTokenData, {
        method: AuthenticationMethod.PASSWORD
      });
      user.refreshTokens.push(refreshTokenObj);
      await user.save();

      res.send({
        data: {
          refreshToken,
          accessToken,
          user: {
            email: user.name,
            name: user.name
          }
        }
      });
      return next();
    }
  }
  // Was not able to authenticate
  res.status(401).end();
  return next();
};

export default password;
