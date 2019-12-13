import { app, begin } from "../app";
import request from "supertest";

describe("App", () => {
  it("should pong", async () => {
    const response = await request(app)
      .get("/ping")
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect(200);
    expect(response.text).toBe("pong");
  });

  it("start and stop", async () => {
    await begin();
  });
});
