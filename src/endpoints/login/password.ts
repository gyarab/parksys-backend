import crypto from "crypto";
import { createToken } from "../../auth/jwt";
import config from "../../config";

const REFERSH_TOKEN = "R";
const ACCESS_TOKEN = "A";

function hashPassword(passowrd: string, salt: string): string {
  return crypto.scryptSync(passowrd, salt, 64).toString("hex");
}

// TODO: Replace with DB/Service interaction
const users = {
  tmscer: {
    id: 1,
    permissions: ["a", "b"],
    auth: {
      salt: "0987654321",
      hash: hashPassword("1234567890", "0987654321")
    }
  }
};

const password = (req, res) => {
  const { user: userName, password } = req.body;
  // Check with DB
  if (!users[userName]) {
    res.status(400).end();
    return;
  }
  const user = users[userName];
  if (user.auth.hash === hashPassword(password, user.auth.salt)) {
    // Authenticated, create a pair of tokens
    const rand16 = crypto.randomBytes(16);
    const refreshToken = createToken(config.get("cryptSecret"), {
      t: REFERSH_TOKEN,
      // TODO: This needs to be saved in the database for refreshing
      tid: rand16,
      user: user.id
    });
    const accessToken = createToken(config.get("cryptSecret"), {
      t: ACCESS_TOKEN,
      rid: rand16,
      expiresAt: new Date().getTime() + 1000 * 60 * 10, // 10 minutes
      user: {
        id: user.id,
        permissions: user.permissions
      }
    });
    res.send({ refreshToken, accessToken });
  } else {
    res.status(401).end();
  }
};

export default password;
