import { User } from "../../types/user/user.model";
import { authenticateUserWithPassword } from "../../auth/password";
import { AsyncHandler } from "../../app";
import { RefreshToken } from "../../types/refreshToken/refreshToken.model";

const password: AsyncHandler = async (req, res, next) => {
  const { user: username, password } = req.body;
  if (
    !username ||
    !password ||
    !(typeof username == "string") ||
    !(typeof password == "string")
  ) {
    res.status(401).end();
    return next();
  }

  try {
    const response = await authenticateUserWithPassword(username, password, {
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
      console.error(e);
    }
    return next(e);
  }
};

export default password;
