import { Check } from "../check.model";

describe("model Check", () => {
  it("has defaults", () => {
    const empty = new Check();
    empty.validate(errors => {
      expect(errors).toBeNull();
    });
    expect(empty.time).toBeInstanceOf(Date);
    const diff = empty.time.getTime() - new Date().getTime();
    expect(diff).toBeLessThanOrEqual(0);
  });
});
