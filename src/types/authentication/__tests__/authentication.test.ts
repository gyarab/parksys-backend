import { Authentication, AuthenticationMethod } from "../authentication.model";

describe("Authentication", () => {
  it("has correct required fields", () => {
    const empty = new Authentication();

    empty.validate(errors => {
      expect(errors.errors.payload).toBeDefined();
      expect(errors.errors.method).toBeDefined();
    });
  });

  it("method enum", () => {
    const password = new Authentication({
      payload: "{}",
      method: AuthenticationMethod.PASSWORD
    });
    password.validate(errors => {
      expect(errors).toBeNull;
    });

    const nada = new Authentication({
      payload: "{}",
      method: "..."
    });
    nada.validate(errors => {
      expect(errors.errors.method).toBeDefined();
    });
  });
});
