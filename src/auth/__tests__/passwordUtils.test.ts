import { hashPassword, createSalt } from "../passwordUtils";

describe("hashPassword", () => {
  it("works", async () => {
    const password = await hashPassword("1234", "NaCl");
    expect(password).toBe(await hashPassword("1234", "NaCl"));
    expect(password).not.toBe(await hashPassword("1234", "KCl"));
    expect(password).not.toBe(await hashPassword("0123", "NaCl"));
  });
});

describe("createSalt", () => {
  it("works", async () => {
    const salt = await createSalt(10);
    expect(salt).toHaveLength(20);
    expect(salt).not.toBe(await createSalt(10));
  });
});
