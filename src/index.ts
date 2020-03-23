import { app, begin } from "./app";
import config from "./config";
import { User } from "./types/user/user.model";
import { AuthenticationMethod } from "./types/authentication/authentication.model";
import { Permission } from "./types/permissions";
import { hashPassword } from "./auth/passwordUtils";
import crypto from "crypto";

const { port, host } = config.get("server");

begin().then(() => {
  app.listen(port, host, () =>
    console.log(`Parking System Backend listening on ${host}:${port}!`)
  );
});

const getRandomPassword = (): Promise<[string, string]> => {
  const n = 10;
  return new Promise((resolve, reject) => {
    crypto.randomBytes(2 * n, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }
      const hex = buf.toString("hex");
      const password = hex.slice(0, n);
      const salt = hex.slice(n);
      resolve([password, salt]);
    });
  });
};

(async () => {
  if (process.env.NODE_ENV === "development") {
    const user1 = await User.findOne({ name: "admin" });
    if (user1) return;
    await User.create([
      {
        name: "admin",
        email: "admin@example.com",
        permissions: [Permission.ALL],
        authentications: [
          {
            method: AuthenticationMethod.PASSWORD,
            payload: {
              h: await hashPassword("1234", "NaCl"),
              s: "NaCl"
            }
          }
        ]
      }
    ]);
    console.log("======================================");
    console.log(`> ADMIN ACCOUNT: admin:1234`);
    console.log("======================================");
  } else if (process.env.NODE_ENV === "production") {
    if ((await User.count({})) === 0) {
      // No user - create
      const username = "admin";
      const [password, salt] = await getRandomPassword();
      console.log("======================================");
      console.log(`> ADMIN ACCOUNT: ${username}:${password}`);
      console.log("======================================");
      await User.create({
        name: username,
        email: "tmscer@gmail.com",
        permissions: [Permission.ALL],
        authentications: [
          {
            method: AuthenticationMethod.PASSWORD,
            payload: {
              h: await hashPassword(password, salt),
              s: salt
            }
          }
        ]
      });
    }
  }
})();
