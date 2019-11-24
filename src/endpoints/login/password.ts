import crypto from "crypto";
import { createToken } from "../../auth/jwt";
import config from "../../config";
import { User, IUserDocument } from "../../types/user/user.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";
import { createTokenPair, IAccessTokenData } from "../../auth/auth";

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

const password = async (req, res) => {
  const { user: userName, password } = req.body;

  if (
    !userName ||
    !password ||
    !(typeof userName == "string") ||
    !(typeof password == "string")
  ) {
    req.status(401).end();
    return;
  }
  let user: IUserDocument = await User.findOne({
    $or: [{ name: userName }, { email: userName }],
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } }
  });

  if (!user) {
    // User with password auth not found
    res.status(401).end();
    return;
  }

  for (const auth of user.authentications.filter(
    auth => auth.method == AuthenticationMethod.PASSWORD
  )) {
    if (
      !auth.payload.hasOwnProperty("h") ||
      !auth.payload.hasOwnProperty("s")
    ) {
      console.error(
        `PASSWORD authentication for user ${user.name} should have h and s props`
      );
      res.status(500).end();
      return;
    }
    const salt = auth.payload["s"];
    const hash = auth.payload["h"];

    if (hash === hashPassword(password, salt)) {
      // Authenticated
      const aTokenData: IAccessTokenData = {
        expiresAt: new Date().getTime() + 1000 * 60 * 10, // +10 minutes
        user: {
          id: user.id,
          permissions: user.permissions
        }
      };
      const {
        accessToken,
        refreshToken: { str: refreshToken, obj: refreshTokenObj }
      } = await createTokenPair(aTokenData);
      user.refreshTokens.push(refreshTokenObj);
      await user.save();

      res.send({ data: { refreshToken, accessToken } });
      return;
    }
  }
  // Was not able to authenticate
  res.status(401).end();
};

export default password;
