import { app, begin } from "./app";
import config from "./config";
import { User } from "./types/user/user.model";
import { AuthenticationMethod } from "./types/authentication/authentication.model";
import { hashPassword } from "./endpoints/login/password";
import { Permission } from "./types/permissions";

const port = config.get("server:port");

begin().then(() => {
  app.listen(port, () =>
    console.log(`Parking System Backend listening on port ${port}!`)
  );
});

(async () => {
  if (process.env.NODE_ENV === "development") {
    const user1 = await User.findOne({ name: "user1" });
    if (user1) return;
    await User.create([
      {
        name: "user1",
        email: "user1@example.com",
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
  }
})();
