import { app, begin } from "./app";
import config from "./config";
import { User } from "./user/user.model";
import { AuthenticationMethod } from "./authentication/authentication.model";
import { hashPassword } from "./endpoints/login/password";

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
        permissions: ["ALL"],
        authentications: [
          {
            method: AuthenticationMethod.PASSWORD,
            payload: {
              h: hashPassword("1234", "NaCl"),
              s: "NaCl"
            }
          }
        ]
      }
    ]);
  }
})();
