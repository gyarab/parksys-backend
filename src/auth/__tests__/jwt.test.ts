import { verifyToken, createToken } from "../jwt";

const secret = "1234567890";

describe("jwt", () => {
  it("creates and verifies token", () => {
    const body = {
      id: 101,
      expiresAt: new Date().getTime() + 1000 * 60 * 10 // current time plus 10 min
    };
    const token = createToken(secret, body);
    expect(verifyToken(secret, token)).toStrictEqual([true, body]);
  });
});
