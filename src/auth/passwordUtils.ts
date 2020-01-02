import crypto from "crypto";

export const hashPassword = (
  password: string,
  salt: string
): Promise<string> => {
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
};

export const createSalt = (bytes: number = 32): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(bytes, (err, salt) => {
      if (err) {
        reject(err);
      } else {
        resolve(salt.toString("hex"));
      }
    });
  });
};
