import { User } from "../user.model";

// TODO: Test resolvers

describe("User", () => {
  it("has correct required fields", () => {
    const empty = new User();

    empty.validate(errors => {
      expect(errors.errors.name).toBeDefined;
      expect(errors.errors.email).toBeDefined;
    });
  });
});
