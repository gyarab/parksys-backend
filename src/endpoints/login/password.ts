import { User, IUser } from "../../types/user/user.model";
import { AuthenticationMethod } from "../../types/authentication/authentication.model";
import { authenticateUser } from "../../auth/auth";
import { AsyncHandler } from "../../app";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";

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
  const user: IUser = await User.findOne({
    $or: [{ name: userName }, { email: userName }],
    authentications: { $elemMatch: { method: AuthenticationMethod.PASSWORD } }
  });

  if (!user) {
    // User with password auth not found
    res.status(401).end();
    return next();
  }
  try {
    const response = await authenticateUser(userName, password, {
      User,
      RefreshToken
    });
    res.send({ data: { ...response, user: response.user.toJSON() } });
    return next();
  } catch (e) {
    if (e.message === "Unable to authenticate") {
      res.status(401).end();
    } else {
      res.status(500).end();
    }
    return next(e);
  }
};

export default password;
