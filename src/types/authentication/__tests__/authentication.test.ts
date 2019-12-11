import { Authentication, AuthenticationMethod } from "../authentication.model";

describe("Authentication", () => {
  it("has correct required fields", async () => {
    const empty = new Authentication();

    try {
      await empty.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.payload).toBeDefined();
      expect(err.errors.method).toBeDefined();
    }
  });

  it("method enum", async () => {
    const password = new Authentication({
      payload: "{}",
      method: AuthenticationMethod.PASSWORD
    });
    try {
      await password.validate();
    } catch (err) {
      fail(err);
    }

    const nada = new Authentication({
      payload: "{}",
      method: "..."
    });
    try {
      await nada.validate();
      fail("expected an error");
    } catch (err) {
      expect(err.errors.method).toBeDefined();
    }
  });
});
