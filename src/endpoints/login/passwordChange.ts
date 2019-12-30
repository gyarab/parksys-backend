import { AsyncHandler } from "../../app";
import { changeUsersPassword, verifyPasswordChangeArgs } from "../../auth/auth";
import { User } from "../../types/user/user.model";

const passwordChange: AsyncHandler = async (req, res, next) => {
  const { userId, newPassword, currentPassword } = req.body;

  const [valid, isAdmin, self, uId] = verifyPasswordChangeArgs({
    token: req.token,
    currentPassword,
    newPassword,
    userId
  });
  if (!valid) {
    res.status(400).end();
    return next();
  }
  try {
    const response = await changeUsersPassword(
      uId,
      currentPassword,
      newPassword,
      { User },
      isAdmin
    );
    res.send({ data: { nChanged: response } });
    return next();
  } catch (e) {
    if (e.message === "Unable to change password") {
      res.status(400).end();
    } else {
      res.status(500).end();
      console.error(e);
    }
    return next(e);
  }
};

export default passwordChange;
